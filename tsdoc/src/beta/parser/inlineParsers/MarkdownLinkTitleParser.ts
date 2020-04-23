import { InlineParser } from "../InlineParser";
import { Token } from "../Token";
import { Scanner } from "../Scanner";
import { MarkdownLinkScanner } from "../scanners/MarkdownLinkScanner";
import { MarkdownLinkTitle, MarkdownLinkTitleQuoteStyle } from "../../nodes/MarkdownLinkTitle";
import { MarkdownUtils } from "../utils/MarkdownUtils";

export namespace MarkdownLinkTitleParser {
    export function tryParse(parser: InlineParser): MarkdownLinkTitle | undefined {
        const scanner: Scanner = parser.scanner;
        const token: Token = scanner.token();
        if (scanner.rescan(MarkdownLinkScanner.rescanLinkTitle) !== Token.LinkTitleToken) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        const text: string = MarkdownUtils.unescapeString(scanner.getTokenValue());
        const quoteStyle: MarkdownLinkTitleQuoteStyle =
            token === Token.ApostropheToken ? MarkdownLinkTitleQuoteStyle.SingleQuote :
            token === Token.OpenParenToken ? MarkdownLinkTitleQuoteStyle.Parenthesized :
            MarkdownLinkTitleQuoteStyle.DoubleQuote;

        scanner.scan();

        return new MarkdownLinkTitle({ pos, end, text, quoteStyle });
    }
}