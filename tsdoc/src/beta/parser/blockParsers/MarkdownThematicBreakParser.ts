import { StartResult, ContinueResult } from "./IBlockSyntaxParser";
import { BlockParser } from "../BlockParser";
import { SyntaxKind } from "../../nodes/SyntaxKind";
import { Token } from "../Token";
import { MarkdownThematicBreakScanner } from "../scanners/MarkdownThematicBreakScanner";
import { Scanner } from "../Scanner";
import { Node } from "../../nodes/Node";
import { MarkdownThematicBreak } from "../../nodes/MarkdownThematicBreak";

export namespace MarkdownThematicBreakParser {
    export const kind: SyntaxKind.MarkdownThematicBreak = SyntaxKind.MarkdownThematicBreak;

    export function tryStart(parser: BlockParser, _container: Node): StartResult {
        // https://spec.commonmark.org/0.29/#thematic-breaks
        //
        // - A line consisting of 0-3 spaces of indentation, followed by a sequence of three or more matching
        //   `-`, `_`, or `*` characters, each followed optionally by any number of spaces or tabs, forms a thematic break.
        if (parser.indent <= 3) {
            const scanner: Scanner = parser.scanner;
            const token: Token = scanner.rescan(MarkdownThematicBreakScanner.rescanThematicBreakToken);
            if (Token.isThematicBreak(token)) {
                const pos: number = scanner.startPos;
                const end: number = scanner.pos;
                scanner.scanWhitespace();
                if (Token.isLineEnding(scanner.scan())) {
                    scanner.scanLine();
                    parser.finishUnmatchedBlocks();
                    parser.pushBlock(new MarkdownThematicBreak({ breakToken: token }), pos, end);
                    return StartResult.Leaf;
                }
            }
        }
        return StartResult.Unmatched;
    }

    export function tryContinue(_parser: BlockParser, _block: MarkdownThematicBreak): ContinueResult {
        // Thematic breaks cannot match more than one line.
        return ContinueResult.Unmatched;
    }

    export function finish(_parser: BlockParser, _block: MarkdownThematicBreak): void {
        // Documents have no finish behavior.
    }
}
