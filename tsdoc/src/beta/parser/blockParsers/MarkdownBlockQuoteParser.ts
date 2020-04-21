import { StartResult, ContinueResult } from "./IBlockSyntaxParser";
import { Token } from "../Token";
import { BlockParser } from "../BlockParser";
import { SyntaxKind } from "../nodes/SyntaxKind";
import { Node } from "../nodes/Node";
import { MarkdownBlockQuote } from "../nodes/MarkdownBlockQuote";
import { Scanner } from "../Scanner";

export namespace MarkdownBlockQuoteParser {
    export const kind: SyntaxKind.MarkdownBlockQuote = SyntaxKind.MarkdownBlockQuote;

    function isStartOfMarkdownBlockQuote(parser: BlockParser): boolean {
        return parser.indent <= 3 && parser.scanner.token() === Token.GreaterThanToken;
    }

    export function tryStart(parser: BlockParser, _container: Node): StartResult {
        // https://spec.commonmark.org/0.29/#block-quotes
        //
        // A block quote marker consists of 0-3 spaces of initial indent, plus
        // (a) the character `>` together with a following space, or (b) a single character `>`
        // not followed by a space.
        const scanner: Scanner = parser.scanner;
        if (isStartOfMarkdownBlockQuote(parser)) {
            const pos: number = scanner.startPos;
            scanner.scan();

            // case (a): consume a single columns-worth of indentation
            if (Token.isIndentCharacter(scanner.token())) {
                scanner.scanColumns(1);
            }

            parser.finishUnmatchedBlocks();
            parser.pushBlock(new MarkdownBlockQuote(), pos);
            return StartResult.Container;
        }
        return StartResult.Unmatched;
    }

    export function tryContinue(parser: BlockParser, _block: MarkdownBlockQuote): ContinueResult {
        // https://spec.commonmark.org/0.29/#block-quotes
        const scanner: Scanner = parser.scanner;
        if (isStartOfMarkdownBlockQuote(parser)) {
            scanner.scan();
            if (Token.isIndentCharacter(scanner.token())) {
                scanner.scanColumns(1);
            }
            return ContinueResult.Matched;
        } else {
            return ContinueResult.Unmatched;
        }
    }

    export function finish(_parser: BlockParser, _block: MarkdownBlockQuote): void {
        // Block quotes have no finish behavior.
    }
}
