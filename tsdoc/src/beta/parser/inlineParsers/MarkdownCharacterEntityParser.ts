import { InlineParser } from "../InlineParser";
import { Run } from "../../nodes/Run";
import { Scanner } from "../Scanner";
import { Token } from "../Token";
import { MarkdownHtmlScanner } from "../scanners/MarkdownHtmlScanner";

export namespace MarkdownCharacterEntityParser {
    export function tryParse(parser: InlineParser): Run | undefined {
        // https://spec.commonmark.org/0.29/#entity-and-numeric-character-references
        const scanner: Scanner = parser.scanner;
        if (scanner.rescan(MarkdownHtmlScanner.rescanHtmlCharacterEntity) !== Token.HtmlCharacterEntity) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        const text: string = scanner.getTokenValue();
        scanner.scan();

        return new Run({ pos, end, text });
    }
}