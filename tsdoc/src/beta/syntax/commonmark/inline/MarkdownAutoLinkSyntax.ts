import { InlineParser } from "../../../parser/InlineParser";
import { Scanner } from "../../../parser/Scanner";
import { Token, TokenLike } from "../../../parser/Token";
import { MarkdownUtils } from "../../../utils/MarkdownUtils";
import { MarkdownLink } from "../../../nodes/MarkdownLink";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { Preprocessor } from "../../../parser/Preprocessor";
import { Inline } from "../../../nodes/Inline";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IInlineSyntax } from "../../IInlineSyntax";

export namespace MarkdownAutoLinkSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<IInlineSyntax>(MarkdownAutoLinkSyntax);

    // Special tokens for Autolinks
    const absoluteUriToken = Symbol("AbsoluteUriToken");    // scheme:uri
    const emailAddressToken = Symbol("EmailAddressToken");  // user@domain

    function isUriSchemeStart(codePoint: number | undefined): boolean {
        // https://spec.commonmark.org/0.29/#scheme
        //
        // a scheme is any sequence of 2–32 characters beginning with an ASCII letter ...
        return UnicodeUtils.isAsciiLetter(codePoint);
    }

    function isUriSchemePart(codePoint: number | undefined): boolean {
        // https://spec.commonmark.org/0.29/#scheme
        //
        // ... and followed by any combination of ASCII letters, digits, or the symbols plus
        // (`+`), period (`.`), or hyphen (`-`).
        return UnicodeUtils.isAsciiLetter(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint)
            || codePoint === CharacterCodes.plus
            || codePoint === CharacterCodes.dot
            || codePoint === CharacterCodes.minus;
    }

    function isUriPart(codePoint: number | undefined): boolean {
        // https://spec.commonmark.org/0.29/#absolute-uri
        //
        // ... zero or more characters other than ASCII whitespace and control characters,
        // `<`, and `>`. If the URI includes these characters, they must be percent-encoded
        // (e.g. `%20` for a space).
        return !UnicodeUtils.isAsciiWhitespace(codePoint)
            && !UnicodeUtils.isControl(codePoint)
            && codePoint !== CharacterCodes.lessThan
            && codePoint !== CharacterCodes.greaterThan
            && codePoint !== undefined;
    }

    function rescanAbsoluteUri(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#absolute-uri
        //
        // An absolute URI, for these purposes, consists of a scheme followed by a colon (`:`)
        // followed by zero or more characters other than ASCII whitespace and control characters,
        // `<`, and `>`. If the URI includes these characters, they must be percent-encoded (e.g.
        // `%20` for a space).
        //
        // For purposes of this spec, a scheme is any sequence of 2–32 characters beginning with an
        // ASCII letter and followed by any combination of ASCII letters, digits, or the symbols
        // plus (`+`), period (`.`), or hyphen (`-`).
        //

        if (scanner.token() !== Token.Text) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);

        const schemeCount: number | undefined = preprocessor.peekMaxCount(0, 32, isUriSchemeStart, isUriSchemePart);
        if (schemeCount === undefined ||
            schemeCount < 2 ||
            !preprocessor.peekIs(schemeCount, CharacterCodes.colon)) {
            return undefined;
        }

        const uriCount: number | undefined = preprocessor.peekCount(schemeCount + 1, isUriPart);
        preprocessor.advance(schemeCount + 1 + uriCount);
        return scanner.setToken(absoluteUriToken);
    }

    function isEmailUserPart(codePoint: number | undefined): boolean {
        // https://spec.commonmark.org/0.29/#email-address
        //
        // From the above spec, the portion of the email regexp corresponding to the username is the following:
        //
        //    [a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+

        return UnicodeUtils.isAsciiLetter(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint)
            || codePoint === CharacterCodes.dot
            || codePoint === CharacterCodes.exclamation
            || codePoint === CharacterCodes.hash
            || codePoint === CharacterCodes.$
            || codePoint === CharacterCodes.percent
            || codePoint === CharacterCodes.ampersand
            || codePoint === CharacterCodes.apostrophe
            || codePoint === CharacterCodes.asterisk
            || codePoint === CharacterCodes.plus
            || codePoint === CharacterCodes.slash
            || codePoint === CharacterCodes.equals
            || codePoint === CharacterCodes.question
            || codePoint === CharacterCodes.caret
            || codePoint === CharacterCodes._
            || codePoint === CharacterCodes.backtick
            || codePoint === CharacterCodes.openBrace
            || codePoint === CharacterCodes.bar
            || codePoint === CharacterCodes.closeBrace
            || codePoint === CharacterCodes.tilde
            || codePoint === CharacterCodes.minus;
    }

    function isEmailLabelStartOrEnd(codePoint: number | undefined): boolean {
        // https://spec.commonmark.org/0.29/#email-address
        //
        // From the above spec, the portion of the email regexp corresponding to the first character of the domain 
        // segment is the following:
        //
        //    [a-zA-Z0-9]

        return UnicodeUtils.isAsciiLetter(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint);
    }

    function isEmailLabelPart(codePoint: number | undefined): boolean {
        // https://spec.commonmark.org/0.29/#email-address
        //
        // From the above spec, the portion of the email regexp corresponding to the characters other than the first
        // or last character of the domain segment is the following:
        //
        //    [a-zA-Z0-9-]

        return isEmailLabelStartOrEnd(codePoint)
            || codePoint === CharacterCodes.minus;
    }

    function rescanEmailAddress(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#email-address
        //
        // An email address, for these purposes, is anything that matches the non-normative regex from the HTML5 spec:
        //
        // /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
        if (!Token.isTextLike(scanner.token())) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);

        let lookAhead: number = preprocessor.peekCount(0, isEmailUserPart);
        if (lookAhead <= 0 || !preprocessor.peekIs(lookAhead, CharacterCodes.at)) {
            return undefined;
        }

        do {
            lookAhead++; // for the `@` or `.`
            const domainCount: number = preprocessor.peekMaxCount(lookAhead, 63,
                isEmailLabelStartOrEnd,
                isEmailLabelPart,
                isEmailLabelStartOrEnd) || 0;
            if (domainCount <= 0) {
                return undefined;
            }
            lookAhead += domainCount;
        } while (preprocessor.peekIs(lookAhead, CharacterCodes.dot));

        preprocessor.advance(lookAhead);
        return scanner.setToken(emailAddressToken);
    }

    /**
     * Attempts to parse an Inline from the current token.
     *
     * NOTE: This function should be executed inside of a call to BlockParser.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param parser The parser used to parse the Inline.
     * @param container The container for the Inline.
     */
    export function tryParseInline(parser: InlineParser): Inline | undefined {
        // https://spec.commonmark.org/0.29/#autolink
        const scanner: Scanner = parser.scanner;
        const pos: number = scanner.startPos;

        // Both URI and email autolinks must start with `<`.
        if (!scanner.expect(Token.LessThanToken)) {
            return undefined;
        }

        // Next they must either contain either:
        // - An email address: https://spec.commonmark.org/0.29/#email-address
        // - An absolute URI: https://spec.commonmark.org/0.29/#absolute-uri
        let destination: string;
        let content: string;
        if (scanner.rescan(rescanEmailAddress) === emailAddressToken) {
            content = scanner.getTokenText();
            destination = MarkdownUtils.normalizeURL('mailto:' + content);
        } else if (scanner.rescan(rescanAbsoluteUri) === absoluteUriToken) {
            content = scanner.getTokenText();
            destination = MarkdownUtils.normalizeURL(content);
        } else {
            return undefined;
        }
        scanner.scan();

        // Finally, both URI and email autolinks must end with `>`.
        if (!scanner.expect(Token.GreaterThanToken)) {
            return undefined;
        }

        const end: number = scanner.startPos;
        return new MarkdownLink({ pos, end, content, destination });
    }
}
