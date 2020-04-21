import { InlineParser } from "../InlineParser";
import { MarkdownCodeSpan } from "../nodes/MarkdownCodeSpan";
import { Scanner } from "../Scanner";
import { MarkdownCodeInlineScanner } from "../scanners/MarkdownCodeInlineScanner";
import { Token } from "../Token";
import { Run } from "../nodes/Run";

export namespace MarkdownCodeSpanParser {
    export function tryParse(parser: InlineParser): MarkdownCodeSpan | Run | undefined {
        // https://spec.commonmark.org/0.29/#code-spans
        const scanner: Scanner = parser.scanner;
        if (scanner.rescan(MarkdownCodeInlineScanner.rescanBacktickString) === Token.BacktickString) {
            const pos: number = scanner.startPos;
            const backtickCount: number = scanner.tokenLength;
            if (scanner.rescan(MarkdownCodeInlineScanner.rescanCodeSpan) === Token.CodeSpan) {
                const text: string = scanner.getTokenValue();
                scanner.scan();

                return parser.setNodePos(new MarkdownCodeSpan({ backtickCount, text }), pos, scanner.startPos);
            }

            const text: string = scanner.getTokenValue();
            scanner.scan();

            const node: Run = new Run();
            parser.getParserState(node).text = text;
            return parser.setNodePos(node, pos, scanner.startPos);
        }
        return undefined;
    }
}