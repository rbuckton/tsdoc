import { Token } from "../Token";
import { Scanner, IRescanStringOptions } from "../Scanner";
import { CharacterCodes } from "../CharacterCodes";
import { UnicodeUtils } from "../utils/UnicodeUtils";
import { Preprocessor } from "../Preprocessor";

export namespace MarkdownLinkScanner {
    function isEscape(preprocessor: Preprocessor, codePoint: number): boolean {
        return codePoint === CharacterCodes.backslash &&
            preprocessor.peekIs(1, UnicodeUtils.isAsciiPunctuation);
    }

    function commit(preprocessor: Preprocessor, from: number): string {
        const segment: string = preprocessor.slice(from, preprocessor.pos);
        preprocessor.read();
        return segment;
    }

    export function rescanLinkLabel(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#link-label
        if (scanner.token() !== Token.OpenBracketToken) return undefined;
        const preprocessor: Preprocessor = scanner.preprocessor;
        const start: number = preprocessor.pos;
        for (;;) {
            const codePoint: number | undefined = preprocessor.peek();
            if (codePoint === undefined ||
                codePoint === CharacterCodes.openBracket ||
                codePoint !== CharacterCodes.closeBracket && preprocessor.pos - start > 999) {
                return undefined;
            }
            if (codePoint === CharacterCodes.closeBracket) {
                return scanner.setToken(Token.LinkLabelToken, commit(preprocessor, start));
            }
            if (isEscape(preprocessor, codePoint)) {
                preprocessor.read();
            }
            preprocessor.read();
        }
    }

    function rescanBracketedLinkDestination(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#link-destination
        const preprocessor: Preprocessor = scanner.preprocessor;
        let start: number = preprocessor.pos;
        let tokenValue: string = "";
        for (;;) {
            const codePoint: number | undefined = preprocessor.peek();
            if (codePoint === undefined ||
                codePoint === CharacterCodes.lineFeed) {
                return undefined;
            }
            if (codePoint === CharacterCodes.greaterThan) {
                return scanner.setToken(Token.LinkDestinationToken, tokenValue + commit(preprocessor, start));
            }
            if (isEscape(preprocessor, codePoint)) {
                tokenValue += commit(preprocessor, start);
                start = preprocessor.pos;
            }
            preprocessor.read();
        }
    }

    function rescanUnbracketedLinkDestination(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#link-destination
        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);
        let start: number = preprocessor.pos;
        let tokenValue: string = "";
        let openCount: number = 0;
        let codePoint: number | undefined;
        for (;;) {
            codePoint = preprocessor.peek();
            if (codePoint === undefined ||
                codePoint === CharacterCodes.closeParen && openCount === 0 ||
                UnicodeUtils.isAsciiWhitespace(codePoint) ||
                UnicodeUtils.isControl(codePoint)) {
                if (openCount ||
                    preprocessor.pos === scanner.startPos && codePoint !== CharacterCodes.closeParen) {
                    return undefined;
                }
                tokenValue += preprocessor.slice(start, preprocessor.pos);
                return scanner.setToken(Token.LinkDestinationToken, tokenValue);
            }
            else if (isEscape(preprocessor, codePoint)) {
                tokenValue += commit(preprocessor, start);
                start = preprocessor.pos;
            }
            else if (codePoint === CharacterCodes.openParen) {
                openCount++;
            }
            else if (codePoint === CharacterCodes.closeParen) {
                openCount--;
            }
            preprocessor.read();
        }
    }

    export function rescanLinkDestination(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#link-destination
        if (scanner.token() === Token.LessThanToken) {
            return rescanBracketedLinkDestination(scanner);
        } else {
            return rescanUnbracketedLinkDestination(scanner);
        }
    }

    const doubleQuotedLinkTitleOptions: IRescanStringOptions = {
        token: Token.LinkTitleToken,
        openQuote: CharacterCodes.quoteMark,
        closeQuote: CharacterCodes.quoteMark,
        noBlankLines: true
    };

    const singleQuotedLinkTitleOptions: IRescanStringOptions = {
        token: Token.LinkTitleToken,
        openQuote: CharacterCodes.apostrophe,
        closeQuote: CharacterCodes.apostrophe,
        noBlankLines: true
    };

    const parenthesizedLinkTitleOptions: IRescanStringOptions = {
        token: Token.LinkTitleToken,
        openQuote: CharacterCodes.openParen,
        closeQuote: CharacterCodes.closeParen,
        noBlankLines: true
    };

    export function rescanLinkTitle(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#link-title
        switch (scanner.token()) {
            case Token.QuoteMarkToken: return scanner.rescan(Scanner.rescanString, doubleQuotedLinkTitleOptions);
            case Token.ApostropheToken: return scanner.rescan(Scanner.rescanString, singleQuotedLinkTitleOptions);
            case Token.OpenParenToken: return scanner.rescan(Scanner.rescanString, parenthesizedLinkTitleOptions);
            default: return undefined;
        }
    }

    export function rescanExclamationOpenBracketToken(scanner: Scanner): Token | undefined {
        if (scanner.token() === Token.ExclamationToken) {
            const preprocessor: Preprocessor = scanner.preprocessor;
            if (preprocessor.peekIs(0, CharacterCodes.openBracket)) {
                preprocessor.read();
                return scanner.setToken(Token.ExclamationOpenBracketToken);
            }
        }
        return undefined;
    }
}
