import { StartResult, ContinueResult } from "./IBlockSyntaxParser";
import { BlockParser } from "../BlockParser";
import { SyntaxKind } from "../../nodes/SyntaxKind";
import { Token } from "../Token";
import { IScannerState, Scanner } from "../Scanner";
import { Node } from "../../nodes/Node";
import { IGfmTaskListMarker, GfmTaskListItem } from "../../nodes/GfmTaskListItem";
import { GfmTaskList } from "../../nodes/GfmTaskList";
import { Preprocessor } from "../Preprocessor";
import { UnicodeUtils } from "../utils/UnicodeUtils";
import { GfmTaskListScanner } from "../scanners/GfmTaskListScanner";

export namespace GfmTaskListItemParser {
    export const kind: SyntaxKind.GfmTaskListItem = SyntaxKind.GfmTaskListItem;

    interface IMutableListMarker {
        markerOffset: number;
        task: true;
        bulletToken: Token.UnorderedListItemBullet;
        checked: boolean;
        tight: boolean;
        padding: number;
    }

    function parseListMarker(parser: BlockParser, container: Node): IGfmTaskListMarker | undefined {
        if (parser.indent >= 4) {
            // an indent of 4+ is a code block
            return undefined;
        }

        const scanner: Scanner = parser.scanner;
        const preprocessor: Preprocessor = scanner.preprocessor;
        const bulletToken: Token = scanner.token();
        const state: IScannerState = scanner.getState();

        // first we must parse an unordered list item bullet
        if (!Token.isUnorderedListItemBullet(bulletToken)) {
            scanner.setState(state);
            return undefined;
        }

        scanner.scan();

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
        const markerWidth: number = scanner.startPos - state.startPos; // to end of marker
        const spacesStart: IScannerState = scanner.getState();
        if (!Token.isLineEnding(scanner.token())) {
            do {
                scanner.scanColumns(1);
            }
            while (scanner.column - spacesStart.column < 5 &&
                Token.isIndentCharacter(scanner.token()));
        }

        const marker: IMutableListMarker = {
            task: true,
            checked: false,
            bulletToken: bulletToken,
            tight: true, // lists are tight by default
            padding: 0,
            markerOffset: parser.indent
        };

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

        // next we must parse the task list marker
        const taskListMarkerToken: Token = scanner.rescan(GfmTaskListScanner.rescanTaskListToken);
        if (!Token.isTaskListMarkerToken(taskListMarkerToken)) {
            scanner.setState(state);
            return undefined;
        }

        scanner.scan();
        scanner.scanWhitespace();
        parser.acceptIndent(); // to start of marker
        marker.checked = taskListMarkerToken === Token.CheckedTaskListMarkerToken;
        return marker;
    }

    export function listsMatch(left: IGfmTaskListMarker, right: IGfmTaskListMarker): boolean {
        return left.task === right.task
            && left.bulletToken === right.bulletToken;
    }

    export function tryStart(parser: BlockParser, container: Node): StartResult {
        // https://spec.commonmark.org/0.29/#list-items
        const scanner: Scanner = parser.scanner;
        if ((parser.indent <= 3 || container.kind === SyntaxKind.GfmTaskList) &&
            Token.isUnorderedListItemBullet(scanner.token())) {
            const pos: number = scanner.startPos;
            const listMarker: IGfmTaskListMarker | undefined = parseListMarker(parser, container);
            if (listMarker) {
                parser.finishUnmatchedBlocks();
                if (!parser.tip ||
                    !(parser.tip instanceof GfmTaskList) ||
                    !(container instanceof GfmTaskList) ||
                    container.firstChildGfmTaskListItem && !listsMatch(container.firstChildGfmTaskListItem.listMarker, listMarker)) {
                    parser.pushBlock(new GfmTaskList(), pos);
                }
                parser.pushBlock(new GfmTaskListItem({ listMarker }), pos);
                return StartResult.Container;
            }
        }
        return StartResult.Unmatched;
    }

    export function tryContinue(parser: BlockParser, block: GfmTaskListItem): ContinueResult {
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

    export function finish(_parser: BlockParser, _block: GfmTaskListItem): void {
        // Task list items have no finish behavior.
    }
}
