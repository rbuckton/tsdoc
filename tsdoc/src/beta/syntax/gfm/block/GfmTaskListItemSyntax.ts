import { BlockParser } from "../../../parser/BlockParser";
import { SyntaxKind } from "../../../nodes/SyntaxKind";
import { Token, TokenLike } from "../../../parser/Token";
import { Scanner } from "../../../parser/Scanner";
import { Node } from "../../../nodes/Node";
import { IGfmTaskListMarker, GfmTaskListItem } from "../../../nodes/GfmTaskListItem";
import { GfmTaskList } from "../../../nodes/GfmTaskList";
import { Preprocessor } from "../../../parser/Preprocessor";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { Block } from "../../../nodes/Block";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IBlockSyntax } from "../../IBlockSyntax";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";
import { StringUtils } from "../../../utils/StringUtils";

export namespace GfmTaskListItemSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IBlockSyntax<GfmTaskListItem>
        & IHtmlEmittable<GfmTaskListItem>
        & ITSDocEmittable<GfmTaskListItem>
    >(GfmTaskListItemSyntax);

    // Special tokens for task lists
    const uncheckedTaskListMarkerToken = Symbol("UncheckedTaskListMarkerToken");    // [ ]
    const checkedTaskListMarkerToken = Symbol("CheckedTaskListMarkerToken");        // [x]

    type TaskListMarkerToken =
        | typeof uncheckedTaskListMarkerToken
        | typeof checkedTaskListMarkerToken
        ;

    function isTaskListMarkerToken(token: TokenLike): token is TaskListMarkerToken {
        return token === uncheckedTaskListMarkerToken
            || token === checkedTaskListMarkerToken;
    }

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

    function rescanTaskListToken(scanner: Scanner): TokenLike | undefined {
        // https://github.github.com/gfm/#task-list-item-marker
        if (scanner.token() !== Token.OpenBracketToken) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        if (preprocessor.peekIsSequence(0, ' ]')) {
            preprocessor.advance(2);
            return scanner.setToken(uncheckedTaskListMarkerToken);
        }

        if (preprocessor.peekIsSequence(0, 'x]') ||
            preprocessor.peekIsSequence(0, 'X]')) {
            preprocessor.advance(2);
            return scanner.setToken(checkedTaskListMarkerToken);
        }

        return undefined;
    }

    interface IMutableListMarker {
        markerOffset: number;
        task: true;
        bullet: '*' | '+' | '-';
        checked: boolean;
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

    function parseListMarker(parser: BlockParser, container: Node): IGfmTaskListMarker | undefined {
        if (parser.indented) {
            // an indent of 4+ is a code block
            return undefined;
        }

        const scanner: Scanner = parser.scanner;
        const preprocessor: Preprocessor = scanner.preprocessor;
        const bulletToken: TokenLike = scanner.token();
        const pos: number = scanner.startPos;

        // first we must parse an unordered list item bullet
        if (!isUnorderedListItemBullet(bulletToken)) {
            return undefined;
        }

        scanner.scan();

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

        const marker: IMutableListMarker = {
            task: true,
            checked: false,
            bullet:
                bulletToken === Token.AsteriskToken ? '*' :
                bulletToken === Token.PlusToken ? '+' :
                '-',
            tight: true, // lists are tight by default
            padding: 0,
            markerOffset: parser.indent
        };

        // we've got a match! advance offset and calculate padding
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

        // next we must parse the task list marker
        const taskListMarkerToken: TokenLike = scanner.rescan(rescanTaskListToken);
        if (!isTaskListMarkerToken(taskListMarkerToken)) {
            return undefined;
        }

        scanner.scan();
        scanner.scanWhitespace();
        parser.acceptIndent(); // to start of marker
        marker.checked = taskListMarkerToken === checkedTaskListMarkerToken;
        return marker;
    }

    function listsMatch(left: IGfmTaskListMarker, right: IGfmTaskListMarker): boolean {
        return left.task === right.task
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
        if ((!parser.indented || container.kind === SyntaxKind.GfmTaskList) &&
            isUnorderedListItemBullet(scanner.token())) {
            const pos: number = scanner.startPos;
            const listMarker: IGfmTaskListMarker | undefined = parseListMarker(parser, container);
            if (listMarker) {
                if (!(container instanceof GfmTaskList) ||
                    container.firstChildGfmTaskListItem && !listsMatch(container.firstChildGfmTaskListItem.listMarker, listMarker)) {
                    const list: GfmTaskList = new GfmTaskList({ pos });
                    container = parser.pushBlock(container, list);
                }
                const node: GfmTaskListItem = new GfmTaskListItem({ pos, listMarker });
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
    export function tryContinueBlock(parser: BlockParser, block: GfmTaskListItem): boolean {
        // https://spec.commonmark.org/0.29/#list-items
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
    export function finishBlock(parser: BlockParser, block: GfmTaskListItem): void {
        // Task list items have no finish behavior.
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: GfmTaskListItem): void {
        const attrs: [string, string][] = [];
        if (node.listMarker.checked) {
            attrs.push(['checked', '']);
        }
        attrs.push(['disabled', ''], ['type', 'checkbox']);
        writer.writeTag('li');
        writer.writeTag('input', attrs);
        writer.write(' ');
        writer.writeContents(node);
        writer.writeTag('/li');
        writer.writeLine();
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: GfmTaskListItem): void {
        const bullet: string = `${node.listMarker.bullet}`;
        const checked: string = node.listMarker.checked ? 'x' : ' ';
        writer.pushBlock({
            indent: node.listMarker.markerOffset,
            firstLinePrefix: `${bullet} [${checked}]${StringUtils.repeat(' ', node.listMarker.padding - bullet.length - 3)}`,
            linePrefix: StringUtils.repeat(' ', node.listMarker.padding)
        });
        writer.writeContents(node);
        writer.popBlock();
    }
}
