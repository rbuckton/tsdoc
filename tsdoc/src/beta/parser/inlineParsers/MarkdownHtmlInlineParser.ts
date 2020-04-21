import { InlineParser } from "../InlineParser";
import { MarkdownHtmlInline } from "../nodes/MarkdownHtmlInline";
import { Scanner } from "../Scanner";
import { Token } from "../Token";
import { MarkdownHtmlScanner } from "../scanners/MarkdownHtmlScanner";

export namespace MarkdownHtmlInlineParser {
    export function tryParse(parser: InlineParser): MarkdownHtmlInline | undefined {
        // https://spec.commonmark.org/0.29/#raw-html
        const scanner: Scanner = parser.scanner;
        if (scanner.token() !== Token.LessThanToken) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const token: Token = scanner.rescan(MarkdownHtmlScanner.rescanHtmlStartToken);
        switch (token) {
            case Token.HtmlCommentStartToken:
                // <!-- ... -->
                while (scanner.rescan(MarkdownHtmlScanner.rescanHtmlEndToken) !== Token.HtmlCommentEndToken) {
                    if (scanner.token() === Token.EndOfFileToken ||
                        scanner.token() === Token.HtmlCommentMinusMinusToken) {
                        return undefined;
                    }
                    scanner.scan();
                }
                scanner.scan();
                break;
            case Token.HtmlProcessingInstructionStartToken:
                // <? ... ?>
                while (scanner.rescan(MarkdownHtmlScanner.rescanHtmlEndToken) !== Token.HtmlProcessingInstructionEndToken) {
                    if (scanner.token() === Token.EndOfFileToken) {
                        return undefined;
                    }
                    scanner.scan();
                }
                scanner.scan();
                break;
            case Token.HtmlDeclarationStartToken:
                // <! ... >
                while (scanner.token() !== Token.GreaterThanToken) {
                    if (scanner.token() === Token.EndOfFileToken) {
                        return undefined;
                    }
                    scanner.scan();
                }
                scanner.scan();
                break;
            case Token.HtmlCharacterDataStartToken:
                // <![CDATA[ ... ]]>
                while (scanner.rescan(MarkdownHtmlScanner.rescanHtmlEndToken) !== Token.HtmlCharacterDataEndToken) {
                    if (scanner.token() === Token.EndOfFileToken) {
                        return undefined;
                    }
                    scanner.scan();
                }
                scanner.scan();
                break;

            case Token.HtmlEndTagStartToken:
            case Token.LessThanToken:
                // </ ... >
                // < ... >
                scanner.scan();
                if (scanner.rescan(MarkdownHtmlScanner.rescanHtmlTagName) !== Token.HtmlTagName) {
                    return undefined;
                }

                scanner.scan();

                // scan past attributes
                let hasWhitespaceSeperator: boolean = scanner.scanWhitespaceAndNewLines();
                if (token === Token.LessThanToken) {
                    while (hasWhitespaceSeperator) {
                        if (scanner.rescan(MarkdownHtmlScanner.rescanHtmlAttributeName) !== Token.HtmlAttributeName) {
                            break;
                        }
                        scanner.scan();
                        hasWhitespaceSeperator = scanner.scanWhitespaceAndNewLines();
                        if (scanner.token() === Token.EqualsToken) {
                            scanner.scan();
                            scanner.scanWhitespaceAndNewLines();
                            if (!Token.isHtmlAttributeValue(scanner.rescan(MarkdownHtmlScanner.rescanHtmlAttributeValue, /*singleLine*/ false))) {
                                return undefined;
                            }
                            scanner.scan();
                            hasWhitespaceSeperator = scanner.scanWhitespaceAndNewLines();
                        }
                    }
                }
                scanner.rescan(MarkdownHtmlScanner.rescanHtmlEndToken);
                if (scanner.token() !== Token.GreaterThanToken &&
                    scanner.token() !== Token.HtmlSelfClosingTagEndToken) {
                    return undefined;
                }
                scanner.scan();
                break;
        }
        const html: string = scanner.slice(pos, scanner.startPos);
        return parser.setNodePos(new MarkdownHtmlInline({ html }), pos, scanner.startPos);
    }
}