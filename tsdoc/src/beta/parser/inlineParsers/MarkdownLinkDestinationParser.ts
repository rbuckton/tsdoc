import { InlineParser } from "../InlineParser";
import { Scanner } from "../Scanner";
import { MarkdownLinkScanner } from "../scanners/MarkdownLinkScanner";
import { Token } from "../Token";
import { MarkdownLinkDestination } from "../nodes/MarkdownLinkDestination";
import { MarkdownUtils } from "../utils/MarkdownUtils";

export namespace MarkdownLinkDestinationParser {
    export function tryParse(parser: InlineParser): MarkdownLinkDestination | undefined {
        const scanner: Scanner = parser.scanner;
        const token: Token = scanner.token();
        if (scanner.rescan(MarkdownLinkScanner.rescanLinkDestination) !== Token.LinkDestinationToken) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        const href: string = MarkdownUtils.normalizeURL(MarkdownUtils.unescapeString(scanner.getTokenValue()));
        const bracketed: boolean = token === Token.LessThanToken;
        scanner.scan();

        const node: MarkdownLinkDestination = new MarkdownLinkDestination({ href, bracketed });
        parser.setParserState(node, { pos, end });
        return node;
    }
}