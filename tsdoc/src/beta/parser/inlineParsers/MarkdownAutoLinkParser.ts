import { InlineParser } from "../InlineParser";
import { Scanner } from "../Scanner";
import { Token } from "../Token";
import { MarkdownAutoLinkScanner } from "../scanners/MarkdownAutoLinkScanner";
import { MarkdownUtils } from "../utils/MarkdownUtils";
import { MarkdownLink } from "../../nodes/MarkdownLink";

export namespace MarkdownAutoLinkParser {
    export function tryParse(parser: InlineParser): MarkdownLink | undefined {
        // https://spec.commonmark.org/0.29/#autolink
        const scanner: Scanner = parser.scanner;
        const pos: number = scanner.startPos;
        
        // Both URI and email autolinks must start with `<`.
        if (scanner.token() !== Token.LessThanToken) {
            return undefined;
        }

        scanner.scan();

        // Next they must either contain either:
        // - An email address: https://spec.commonmark.org/0.29/#email-address
        // - An absolute URI: https://spec.commonmark.org/0.29/#absolute-uri
        let destination: string;
        let text: string;
        if (scanner.rescan(MarkdownAutoLinkScanner.rescanEmailAddress) === Token.EmailAddress) {
            text = scanner.getTokenText();
            destination = MarkdownUtils.normalizeURL('mailto:' + text);
        } else if (scanner.rescan(MarkdownAutoLinkScanner.rescanAbsoluteUri) === Token.AbsoluteUri) {
            text = scanner.getTokenText();
            destination = MarkdownUtils.normalizeURL(text);
        } else {
            return undefined;
        }

        scanner.scan();

        // Finally, both URI and email autolinks must end with `>`.
        if (scanner.token() !== Token.GreaterThanToken) {
            return undefined;
        }

        scanner.scan();

        const end: number = scanner.startPos;
        return new MarkdownLink({
            content: text,
            pos,
            end,
            destination
        });
    }
}
