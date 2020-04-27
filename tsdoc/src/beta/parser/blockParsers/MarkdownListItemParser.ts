import { StartResult, ContinueResult } from "./IBlockSyntaxParser";
import { BlockParser } from "../BlockParser";
import { SyntaxKind } from "../../nodes/SyntaxKind";
import { Token } from "../Token";
import { IScannerState, Scanner } from "../Scanner";
import { Node } from "../../nodes/Node";
import { MarkdownListItem } from "../../nodes/MarkdownListItem";
import { MarkdownList } from "../../nodes/MarkdownList";
import { ListMarker } from "../../nodes/ListItemBase";
import { Preprocessor } from "../Preprocessor";
import { UnicodeUtils } from "../utils/UnicodeUtils";

export namespace MarkdownListItemParser {
    export const kind: SyntaxKind.MarkdownListItem = SyntaxKind.MarkdownListItem;

    interface IMutableOrderedListMarker {
        markerOffset: number;
        ordered: true;
        bulletToken: Token.OrderedListItemBullet;
        start: number;
        tight: boolean;
        padding: number;
    }
    
    interface IMutableUnorderedListMarker {
        markerOffset: number;
        ordered: false;
        bulletToken: Token.UnorderedListItemBullet;
        tight: boolean;
        padding: number;
    }

    function parseListMarker(parser: BlockParser, container: Node): ListMarker | undefined {
        if (parser.indent >= 4) {
            // an indent of 4+ is a code block
            return undefined;
        }

        const scanner: Scanner = parser.scanner;
        const preprocessor: Preprocessor = scanner.preprocessor;
        const token: Token = scanner.token();
        const state: IScannerState = scanner.getState();
        let marker: IMutableOrderedListMarker | IMutableUnorderedListMarker | undefined;
        if (Token.isUnorderedListItemBullet(token)) {
            marker = {
                ordered: false,
                bulletToken: token,
                tight: true, // lists are tight by default
                padding: 0,
                markerOffset: parser.indent
            };
            scanner.scan();
        } else if (token === Token.DecimalDigits) {
            const tokenValue: string = scanner.getTokenValue();
            if (tokenValue.length <= 9 && (container.kind !== SyntaxKind.MarkdownParagraph || tokenValue === "1")) {
                const token: Token = scanner.scan();
                if (Token.isOrderedListItemBullet(token)) {
                    marker = {
                        ordered: true,
                        bulletToken: token,
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
            scanner.setState(state);
            return undefined;
        }

        // make sure we have spaces after
        if (scanner.token() !== Token.EndOfFileToken &&
            scanner.token() !== Token.SpaceTrivia &&
            scanner.token() !== Token.TabTrivia &&
            scanner.token() !== Token.NewLineTrivia) {
            scanner.setState(state);
            return undefined;
        }

        // if it interrupts a paragraph, make sure the first line isn't blank
        if (container.kind === SyntaxKind.MarkdownParagraph) {
            const spaceCount: number = preprocessor.peekCount(0, UnicodeUtils.isSpaceOrTab);
            if (preprocessor.peekIsAny(spaceCount, UnicodeUtils.isUnicodeWhitespace, undefined /*EOF*/)) {
                scanner.setState(state);
                return undefined;
            }
        }

        // we've got a match! advance offset and calculate padding
        parser.acceptIndent(); // to start of marker
        const markerWidth: number = scanner.startPos - state.startPos; // to end of marker
        const spacesStart: IScannerState = scanner.getState();
        if (!Token.isLineEnding(scanner.token())) {
            do {
                scanner.scanColumns(1);
            }
            while (scanner.column - spacesStart.column < 5 &&
                Token.isIndentCharacter(scanner.token()));
        }

        const blank: boolean = Token.isLineEnding(scanner.token());
        const spacesAfterMarker: number = scanner.column - spacesStart.column;
        if (spacesAfterMarker >= 5 || spacesAfterMarker < 1 || blank) {
            marker.padding = markerWidth + 1;
            scanner.setState(spacesStart);
            if (Token.isIndentCharacter(scanner.token())) {
                scanner.scanColumns(1);
            }
        } else {
            marker.padding = markerWidth + spacesAfterMarker;
        }
        return marker;
    }

    export function listsMatch(left: ListMarker, right: ListMarker): boolean {
        return left.ordered === right.ordered
            && left.bulletToken === right.bulletToken;
    }

    export function tryStart(parser: BlockParser, container: Node): StartResult {
        // https://spec.commonmark.org/0.29/#list-items
        const scanner: Scanner = parser.scanner;
        if ((parser.indent <= 3 || container.kind === SyntaxKind.MarkdownList) &&
            (Token.isListItemBullet(scanner.token()) || scanner.token() === Token.DecimalDigits)) {
            const pos: number = scanner.startPos;
            const listMarker: ListMarker | undefined = parseListMarker(parser, container);
            if (listMarker) {
                parser.finishUnmatchedBlocks();
                if (!parser.tip ||
                    !parser.tip.isListItemContainer() ||
                    !container.isListItemContainer() ||
                    container.firstChildListItem && !listsMatch(container.firstChildListItem.listMarker, listMarker)) {
                    parser.pushBlock(new MarkdownList(), pos);
                }
                parser.pushBlock(new MarkdownListItem({ listMarker }), pos);
                return StartResult.Container;
            }
        }
        return StartResult.Unmatched;
    }

    export function tryContinue(parser: BlockParser, block: MarkdownListItem): ContinueResult {
        const scanner: Scanner = parser.scanner;
        if (parser.blank) {
            return block.firstChild ? ContinueResult.Matched : ContinueResult.Unmatched;
        } else if (parser.indent >= block.listMarker.markerOffset + block.listMarker.padding) {
            parser.retreatToIndentStart();
            scanner.scanColumns(block.listMarker.markerOffset + block.listMarker.padding);
            parser.acceptIndent();
            return ContinueResult.Matched;
        }
        return ContinueResult.Unmatched;
    }

    export function finish(_parser: BlockParser, _block: MarkdownListItem): void {
        // List items have no finish behavior.
    }
}
