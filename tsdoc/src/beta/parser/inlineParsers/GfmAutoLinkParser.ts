import { InlineParser } from "../InlineParser";
import { Scanner } from "../Scanner";
import { Token } from "../Token";
import { MarkdownLink } from "../../nodes/MarkdownLink";
import { IInlineContainer } from "../../nodes/Inline";
import { GfmAutolinkScanner as GfmAutoLinkScanner } from "../scanners/GfmAutoLinkScanner";
import { Run } from "../../nodes/Run";
import { MarkdownUtils } from "../utils/MarkdownUtils";

export namespace GfmAutoLinkParser {
    function tryParseUrl(parser: InlineParser): MarkdownLink | undefined {
        const scanner: Scanner = parser.scanner;
        const pos: number = scanner.startPos;
        if (scanner.rescan(GfmAutoLinkScanner.rescanGfmUrlAutolink) !== Token.GfmUrlAutolinkToken) {
            return undefined;
        }

        const text: string = scanner.getTokenValue();
        const end: number = scanner.pos;
        scanner.scan();

        const run: Run = new Run({ pos, end, text });
        const node: MarkdownLink = new MarkdownLink({
            pos,
            end,
            content: run,
            destination: MarkdownUtils.normalizeURL(text)
        });
        return node;
    }

    function tryParseWww(parser: InlineParser): MarkdownLink | undefined {
        const scanner: Scanner = parser.scanner;
        const pos: number = scanner.startPos;
        if (scanner.rescan(GfmAutoLinkScanner.rescanGfmWwwAutolink) !== Token.GfmWwwAutolinkToken) {
            return undefined;
        }

        const text: string = scanner.getTokenValue();
        const end: number = scanner.pos;
        scanner.scan();

        const run: Run = new Run({ pos, end, text });
        const node: MarkdownLink = new MarkdownLink({
            pos,
            end,
            content: run,
            destination: MarkdownUtils.normalizeURL(`http://${text}`)
        });
        return node;
    }

    function tryParseEmail(parser: InlineParser): MarkdownLink | undefined {
        const scanner: Scanner = parser.scanner;
        const pos: number = scanner.startPos;
        if (scanner.rescan(GfmAutoLinkScanner.rescanEmailAddress) !== Token.EmailAddress) {
            return undefined;
        }

        const text: string = scanner.getTokenValue();
        const end: number = scanner.pos;
        scanner.scan();

        const run: Run = new Run({ pos, end, text });
        const node: MarkdownLink = new MarkdownLink({
            pos,
            end,
            content: run,
            destination: MarkdownUtils.normalizeURL(`mailto:${text}`)
        });
        return node;
    }

    export function tryParse(parser: InlineParser, parent: IInlineContainer): MarkdownLink | undefined {
        // https://github.github.com/gfm/#autolinks-extension-
        if (parser.peekBracket()) {
            return undefined;
        }

        return tryParseUrl(parser) || tryParseWww(parser) || tryParseEmail(parser);
    }
}
