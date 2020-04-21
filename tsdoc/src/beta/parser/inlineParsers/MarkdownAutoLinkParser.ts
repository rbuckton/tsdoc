import { InlineParser } from "../InlineParser";
import { Scanner } from "../Scanner";
import { Token } from "../Token";
import { MarkdownAutoLinkScanner } from "../scanners/MarkdownAutoLinkScanner";
import { MarkdownAutoLink } from "../nodes/MarkdownAutoLink";

export namespace MarkdownAutoLinkParser {
    export function tryParse(parser: InlineParser): MarkdownAutoLink | undefined {
        // https://spec.commonmark.org/0.29/#autolink
        const scanner: Scanner = parser.scanner;
        const pos: number = scanner.startPos;
        if (scanner.token() === Token.LessThanToken) {
            scanner.scan();
            let href: string;
            if (scanner.rescan(MarkdownAutoLinkScanner.rescanEmailAddress) !== Token.EmailAddress) {
                scanner.rescan(MarkdownAutoLinkScanner.rescanAbsoluteUri);
            }
            const linkToken: Token = scanner.token();
            if (linkToken === Token.AbsoluteUri || linkToken === Token.EmailAddress) {
                href = scanner.getTokenText();
                scanner.scan();
                if (scanner.token() === Token.GreaterThanToken) {
                    scanner.scan();
                    return parser.setNodePos(new MarkdownAutoLink({ destination: href, linkToken }), pos, scanner.startPos);
                }
            }
        }
        return undefined;
    }
}
