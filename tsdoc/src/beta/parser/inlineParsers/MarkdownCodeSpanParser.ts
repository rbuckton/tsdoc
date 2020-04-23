import { InlineParser } from "../InlineParser";
import { MarkdownCodeSpan } from "../../nodes/MarkdownCodeSpan";
import { Scanner } from "../Scanner";
import { MarkdownCodeInlineScanner } from "../scanners/MarkdownCodeInlineScanner";
import { Token } from "../Token";
import { Run } from "../../nodes/Run";

export namespace MarkdownCodeSpanParser {
    export function tryParse(parser: InlineParser): MarkdownCodeSpan | Run | undefined {
        // https://spec.commonmark.org/0.29/#code-spans
        const scanner: Scanner = parser.scanner;
        if (scanner.rescan(MarkdownCodeInlineScanner.rescanBacktickString) === Token.BacktickString) {
            const pos: number = scanner.startPos;
            const backtickCount: number = scanner.tokenLength;
            if (scanner.rescan(MarkdownCodeInlineScanner.rescanCodeSpan) === Token.CodeSpan) {
                const text: string = scanner.getTokenValue();
                const end: number = scanner.pos;
                scanner.scan();

                return new MarkdownCodeSpan({ pos, end, backtickCount, text });
            }

            const text: string = scanner.getTokenValue();
            const end: number = scanner.pos;
            scanner.scan();

            const node: Run = new Run({ pos, end });
            parser.getParserState(node).text = text;
            return node;
        }
        return undefined;
    }
}