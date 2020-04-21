import { InlineParser } from "../InlineParser";
import { Run } from "../nodes/Run";
import { Scanner } from "../Scanner";
import { Token } from "../Token";
import { MarkdownHtmlScanner } from "../scanners/MarkdownHtmlScanner";

export namespace MarkdownCharacterEntityParser {
    export function tryParse(parser: InlineParser): Run | undefined {
        // https://spec.commonmark.org/0.29/#entity-and-numeric-character-references
        const scanner: Scanner = parser.scanner;
        if (scanner.rescan(MarkdownHtmlScanner.rescanHtmlCharacterEntity) === Token.HtmlCharacterEntity) {
            const pos: number = scanner.startPos;
            const text: string = scanner.getTokenValue();
            scanner.scan();
            const run: Run = new Run();
            parser.getParserState(run).text = text;
            return parser.setNodePos(run, pos, scanner.startPos);
        }
        return undefined;
    }
}