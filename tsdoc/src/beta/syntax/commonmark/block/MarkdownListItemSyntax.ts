import { BlockParser } from "../../../parser/BlockParser";
import { SyntaxKind } from "../../../nodes/SyntaxKind";
import { Token, TokenLike } from "../../../parser/Token";
import { Scanner } from "../../../parser/Scanner";
import { Node } from "../../../nodes/Node";
import { ListMarker, MarkdownListItem } from "../../../nodes/MarkdownListItem";
import { MarkdownList } from "../../../nodes/MarkdownList";
import { Preprocessor } from "../../../parser/Preprocessor";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { Block } from "../../../nodes/Block";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IBlockSyntax } from "../../IBlockSyntax";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";
import { StringUtils } from "../../../utils/StringUtils";

export namespace MarkdownListItemSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IBlockSyntax<MarkdownListItem>
        & IHtmlEmittable<MarkdownListItem>
        & ITSDocEmittable<MarkdownListItem>
    >(MarkdownListItemSyntax);

    type UnorderedListItemBullet =
        | Token.AsteriskToken
        | Token.PlusToken
        | Token.MinusToken
        ;

    function isUnorderedListItemBullet(token: TokenLike): token is UnorderedListItemBullet {
        return token === Token.AsteriskToken
            || token === Token.PlusToken
            || token === Token.MinusToken;
    }

    type OrderedListItemBullet =
        | Token.CloseParenToken
        | Token.DotToken
        ;

    function isOrderedListItemBullet(token: TokenLike): token is OrderedListItemBullet {
        return token === Token.CloseParenToken
            || token === Token.DotToken;
    }

    type ListItemBullet =
        | UnorderedListItemBullet
        | OrderedListItemBullet
        ;

    function isListItemBullet(token: TokenLike): token is ListItemBullet {
        return isUnorderedListItemBullet(token)
            || isOrderedListItemBullet(token);
    }

    interface IMutableOrderedListMarker {
        markerOffset: number;
        ordered: true;
        bullet: ')' | '.';
        start: number;
        tight: boolean;
        padding: number;
    }

    interface IMutableUnorderedListMarker {
        markerOffset: number;
        ordered: false;
        bullet: '*' | '+' | '-';
        tight: boolean;
        padding: number;
    }

    function lookAheadPadding(scanner: Scanner): { spacesAfterMarker: number, blank: boolean } {
        const column: number = scanner.column;
        if (!Token.isLineEnding(scanner.token())) {
            do {
                scanner.scanColumns(1);
            }
            while (scanner.column - column < 5 && Token.isIndentCharacter(scanner.token()));
        }
        const spacesAfterMarker: number = scanner.column - column;
        const blank: boolean = Token.isLineEnding(scanner.token());
        return { spacesAfterMarker, blank };
    }

    function parseListMarker(parser: BlockParser, container: Node): ListMarker | undefined {
        if (parser.indented) {
            // an indent of 4+ is a code block
            return undefined;
        }

        const scanner: Scanner = parser.scanner;
        const preprocessor: Preprocessor = scanner.preprocessor;
        const token: TokenLike = scanner.token();
        const pos: number = scanner.startPos;
        let marker: IMutableOrderedListMarker | IMutableUnorderedListMarker | undefined;
        if (isUnorderedListItemBullet(token)) {
            marker = {
                ordered: false,
                bullet:
                    token === Token.AsteriskToken ? '*' :
                    token === Token.PlusToken ? '+' :
                    '-',
                tight: true, // lists are tight by default
                padding: 0,
                markerOffset: parser.indent
            };
            scanner.scan();
        } else if (token === Token.DecimalDigits) {
            const tokenValue: string = scanner.getTokenValue();
            if (tokenValue.length <= 9 && (container.kind !== SyntaxKind.MarkdownParagraph || tokenValue === "1")) {
                const token: TokenLike = scanner.scan();
                if (isOrderedListItemBullet(token)) {
                    marker = {
                        ordered: true,
                        bullet: token === Token.CloseParenToken ? ')' : '.',
                        tight: true, // lists are tight by default.
                        padding: 0,
                        markerOffset: parser.indent,
                        start: parseInt(tokenValue, 10)
                    };
                    scanner.scan();
                }
            }
        }

        if (!marker) {
            return undefined;
        }

        // make sure we have spaces after
        if (scanner.token() !== Token.EndOfFileToken &&
            scanner.token() !== Token.SpaceTrivia &&
            scanner.token() !== Token.TabTrivia &&
            scanner.token() !== Token.NewLineTrivia) {
            return undefined;
        }

        // if it interrupts a paragraph, make sure the first line isn't blank
        if (container.kind === SyntaxKind.MarkdownParagraph) {
            const spaceCount: number = preprocessor.peekCount(0, UnicodeUtils.isSpaceOrTab);
            if (preprocessor.peekIsAny(spaceCount, UnicodeUtils.isUnicodeWhitespace, undefined /*EOF*/)) {
                return undefined;
            }
        }

        // we've got a match! advance offset and calculate padding
        parser.acceptIndent(); // to start of marker
        const markerWidth: number = scanner.startPos - pos; // to end of marker
        const { spacesAfterMarker, blank } = scanner.lookAhead(lookAheadPadding);
        if (spacesAfterMarker >= 1 && spacesAfterMarker < 5 && !blank) {
            marker.padding = markerWidth + spacesAfterMarker;
            scanner.scanColumns(spacesAfterMarker);
        } else {
            marker.padding = markerWidth + 1;
            if (Token.isIndentCharacter(scanner.token())) {
                scanner.scanColumns(1);
            }
        }

        return marker;
    }

    function listsMatch(left: ListMarker, right: ListMarker): boolean {
        return left.ordered === right.ordered
            && left.bullet === right.bullet;
    }

    /**
     * Attempts to start a new Block syntax at the current token.
     *
     * NOTE: This function should be executed inside of a call to BlockParser.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param parser The parser used to parse the Block.
     * @param container The containing Block for the current token.
     * @returns A new Block if the block was started; otherwise, `undefined`.
     */
    export function tryStartBlock(parser: BlockParser, container: Block): Block | undefined {
        // https://spec.commonmark.org/0.29/#list-items
        const scanner: Scanner = parser.scanner;
        if ((!parser.indented || container.kind === SyntaxKind.MarkdownList) &&
            (isListItemBullet(scanner.token()) || scanner.token() === Token.DecimalDigits)) {
            const pos: number = scanner.startPos;
            const listMarker: ListMarker | undefined = parseListMarker(parser, container);
            if (listMarker) {
                if (!(container instanceof MarkdownList) ||
                    container.firstChildMarkdownListItem && !listsMatch(container.firstChildMarkdownListItem.listMarker, listMarker)) {
                    const list: MarkdownList = new MarkdownList({ pos });
                    container = parser.pushBlock(container, list);
                }
                const node: MarkdownListItem = new MarkdownListItem({ pos, listMarker });
                parser.pushBlock(container, node);
                return node;
            }
        }
        return undefined;
    }

    /**
     * Attempts to continue an existing Block syntax on a subsequent line.
     *
     * NOTE: This function should be executed inside of a call to BlockParser.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param parser The parser used to parse the Block.
     * @param block The Block to continue.
     * @returns `true` if the Block was continued; otherwise, `false`.
     */
    export function tryContinueBlock(parser: BlockParser, block: MarkdownListItem): boolean {
        const scanner: Scanner = parser.scanner;
        if (parser.blank) {
            return !!block.firstChild;
        } else if (parser.indent >= block.listMarker.markerOffset + block.listMarker.padding) {
            parser.retreatToIndentStart();
            scanner.scanColumns(block.listMarker.markerOffset + block.listMarker.padding);
            parser.acceptIndent();
            return true;
        }
        return false;
    }

    /**
     * Finishes the current block, performing any necessary block-level post-processing.
     * @param parser The parser used to parse the Block.
     * @param block The Block to finish.
     */
    export function finishBlock(parser: BlockParser, block: MarkdownListItem): void {
        // List items have no finish behavior.
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: MarkdownListItem): void {
        writer.writeTag('li');
        writer.writeContents(node);
        writer.writeTag('/li');
        writer.writeLine();
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownListItem): void {
        const bullet: string = node.listMarker.ordered ?
            `${node.listMarker.start}${node.listMarker.bullet}` :
            `${node.listMarker.bullet}`;
        writer.pushBlock({
            indent: node.listMarker.markerOffset,
            firstLinePrefix: `${bullet}${StringUtils.repeat(' ', node.listMarker.padding - bullet.length)}`,
            linePrefix: StringUtils.repeat(' ', node.listMarker.padding)
        });
        writer.writeContents(node);
        writer.popBlock();
    }
}
