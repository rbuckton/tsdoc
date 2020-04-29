import { Scanner } from "../Scanner";
import { Token } from "../Token";
import { Preprocessor } from "../Preprocessor";
import { UnicodeUtils } from "../utils/UnicodeUtils";
import { CharacterCodes } from "../CharacterCodes";

export namespace MarkdownAutoLinkScanner {
    export function isUriSchemeStart(codePoint: number | undefined): boolean {
        return UnicodeUtils.isAsciiLetter(codePoint);
    }

    export function isUriSchemePart(codePoint: number | undefined): boolean {
        return UnicodeUtils.isAsciiLetter(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint)
            || codePoint === CharacterCodes.plus
            || codePoint === CharacterCodes.dot
            || codePoint === CharacterCodes.minus;
    }

    export function isUriPart(codePoint: number | undefined): boolean {
        return !UnicodeUtils.isAsciiWhitespace(codePoint)
            && !UnicodeUtils.isControl(codePoint)
            && codePoint !== CharacterCodes.lessThan
            && codePoint !== CharacterCodes.greaterThan
            && codePoint !== undefined;
    }

    export function rescanAbsoluteUri(scanner: Scanner): Token | undefined {
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

        if (scanner.token() === Token.Text) {
            const preprocessor: Preprocessor = scanner.preprocessor;
            preprocessor.setPos(scanner.startPos);
            const schemeCount: number | undefined = preprocessor.peekMaxCount(0, 32, isUriSchemeStart, isUriSchemePart);
            if (schemeCount !== undefined && schemeCount >= 2 && preprocessor.peekIs(schemeCount, CharacterCodes.colon)) {
                const uriCount: number | undefined = preprocessor.peekCount(schemeCount + 1, isUriPart);
                preprocessor.advance(schemeCount + 1 + uriCount);
                return scanner.setToken(Token.AbsoluteUri);
            }
        }
        return undefined;
    }

    export function isEmailUserPart(codePoint: number | undefined): boolean {
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

    export function isEmailLabelStart(codePoint: number | undefined): boolean {
        return UnicodeUtils.isAsciiLetter(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint);
    }

    export function isEmailLabelEnd(codePoint: number | undefined): boolean {
        return UnicodeUtils.isAsciiLetter(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint);
    }

    export function isEmailLabelPart(codePoint: number | undefined): boolean {
        return isEmailLabelStart(codePoint)
            || codePoint === CharacterCodes.minus;
    }

    export function rescanEmailAddress(scanner: Scanner): Token | undefined {
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
                isEmailLabelStart,
                isEmailLabelPart,
                isEmailLabelEnd) || 0;
            if (domainCount <= 0) {
                return undefined;
            }
            lookAhead += domainCount;
        }
        while (preprocessor.peekIs(lookAhead, CharacterCodes.dot));

        preprocessor.advance(lookAhead);
        return scanner.setToken(Token.EmailAddress);
    }
}