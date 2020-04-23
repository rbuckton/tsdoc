import { InlineParser } from "../InlineParser";
import { Token } from "../Token";
import { Run } from "../../nodes/Run";
import { Scanner } from "../Scanner";
import { MarkdownBackslashEscapeScanner } from "../scanners/MarkdownBackslashEscapeScanner";

export namespace MarkdownBackslashEscapeParser {
    export function tryParse(parser: InlineParser): Run | undefined {
        // https://spec.commonmark.org/0.29/#backslash-escapes
        const scanner: Scanner = parser.scanner;
        if (scanner.rescan(MarkdownBackslashEscapeScanner.rescanBackslashEscape) !== Token.BackslashEscapeCharacter) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        const text: string = scanner.getTokenValue();
        scanner.scan();

        return new Run({ pos, end, text });
    }
}