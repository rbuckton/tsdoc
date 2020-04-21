import { Scanner } from "../Scanner";
import { Token } from "../Token";
import { CharacterCodes } from "../CharacterCodes";
import { UnicodeUtils } from "../utils/UnicodeUtils";
import { Preprocessor } from "../Preprocessor";
import { HtmlUtils } from "../utils/HtmlUtils";

// https://spec.commonmark.org/0.29/#raw-html
export namespace MarkdownHtmlScanner {
    export function rescanHtmlStartToken(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#open-tag
        // https://spec.commonmark.org/0.29/#processing-instruction
        // https://spec.commonmark.org/0.29/#html-comment
        // https://spec.commonmark.org/0.29/#declaration
        // https://spec.commonmark.org/0.29/#cdata-section
        // https://spec.commonmark.org/0.29/#closing-tag
        const preprocessor: Preprocessor = scanner.preprocessor;
        if (scanner.token() === Token.LessThanToken) {
            // https://spec.commonmark.org/0.29/#processing-instruction
            // <?
            if (preprocessor.peekIs(0, CharacterCodes.question)) {
                preprocessor.advance(1);
                return scanner.setToken(Token.HtmlProcessingInstructionStartToken);
            }
            // https://spec.commonmark.org/0.29/#html-comment
            // <!--
            if (preprocessor.peekIsSequence(0,
                CharacterCodes.exclamation,
                CharacterCodes.minus,
                CharacterCodes.minus)) {
                preprocessor.advance(3);
                // NOTE: '<!-->' and '<!--->' are not valid comments.
                if (preprocessor.peekIs(0, CharacterCodes.greaterThan) ||
                    preprocessor.peekIsSequence(0, CharacterCodes.minus, CharacterCodes.greaterThan)) {
                    return undefined;
                }
                return scanner.setToken(Token.HtmlCommentStartToken);
            }
            // https://spec.commonmark.org/0.29/#declaration
            // <! (followed by A-Z)
            if (preprocessor.peekIsSequence(0,
                CharacterCodes.exclamation,
                UnicodeUtils.isAsciiUpperCaseLetter)) {
                preprocessor.advance(1); // do not include the alpha character.
                return scanner.setToken(Token.HtmlDeclarationStartToken);
            }
            // https://spec.commonmark.org/0.29/#cdata-section
            // <![CDATA[
            if (preprocessor.peekIsSequence(0,
                CharacterCodes.exclamation,
                CharacterCodes.openBracket,
                CharacterCodes.C,
                CharacterCodes.D,
                CharacterCodes.A,
                CharacterCodes.T,
                CharacterCodes.A,
                CharacterCodes.openBracket)) {
                preprocessor.advance(8);
                return scanner.setToken(Token.HtmlCharacterDataStartToken);
            }
            // https://spec.commonmark.org/0.29/#closing-tag
            // </
            if (preprocessor.peekIs(0, CharacterCodes.slash)) {
                preprocessor.advance(1);
                return scanner.setToken(Token.HtmlEndTagStartToken);
            }
        }
        return undefined;
    }

    export function rescanHtmlEndToken(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#open-tag
        // https://spec.commonmark.org/0.29/#processing-instruction
        // https://spec.commonmark.org/0.29/#html-comment
        // https://spec.commonmark.org/0.29/#declaration
        // https://spec.commonmark.org/0.29/#cdata-section
        // https://spec.commonmark.org/0.29/#closing-tag
        const preprocessor: Preprocessor = scanner.preprocessor;
        switch (scanner.token()) {
            case Token.QuestionToken:
                // https://spec.commonmark.org/0.29/#processing-instruction
                // ?>
                if (preprocessor.peekIs(0, CharacterCodes.greaterThan)) {
                    preprocessor.advance(1);
                    return scanner.setToken(Token.HtmlProcessingInstructionEndToken);
                }
                return;
            case Token.MinusToken:
                // https://spec.commonmark.org/0.29/#html-comment
                // -->
                if (preprocessor.peekIsSequence(0,
                    CharacterCodes.minus,
                    CharacterCodes.greaterThan)) {
                    preprocessor.advance(2);
                    return scanner.setToken(Token.HtmlCommentEndToken);
                }
                // NOTE: '--' is invalid in a comment
                if (preprocessor.peekIs(0, CharacterCodes.minus)) {
                    preprocessor.advance(1);
                    return scanner.setToken(Token.HtmlCommentMinusMinusToken);
                }
                break;
            case Token.CloseBracketToken:
                // https://spec.commonmark.org/0.29/#cdata-section
                // ]]>
                if (preprocessor.peekIsSequence(0,
                    CharacterCodes.closeBracket,
                    CharacterCodes.greaterThan)) {
                    preprocessor.advance(2);
                    return scanner.setToken(Token.HtmlCharacterDataEndToken);
                }
                break;
            case Token.SlashToken:
                // https://spec.commonmark.org/0.29/#open-tag
                // />
                if (preprocessor.peekIs(0, CharacterCodes.greaterThan)) {
                    preprocessor.advance(1);
                    return scanner.setToken(Token.HtmlSelfClosingTagEndToken);
                }
                break;
        }
        return undefined;
    }

    export function isHtmlTagNameStart(codePoint: number | undefined): boolean {
        // https://spec.commonmark.org/0.29/#tag-name
        return UnicodeUtils.isAsciiLetter(codePoint);
    }

    export function isHtmlTagNamePart(codePoint: number | undefined): boolean {
        // https://spec.commonmark.org/0.29/#tag-name
        return isHtmlTagNameStart(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint)
            || codePoint === CharacterCodes.minus;
    }

    /**
     * Rescans the current token to reinterpret it as an HTML tag name.
     */
    export function rescanHtmlTagName(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#tag-name
        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);
        const count: number = preprocessor.peekCount(0, isHtmlTagNameStart, isHtmlTagNamePart);
        if (count > 0) {
            preprocessor.advance(count);
            return scanner.setToken(Token.HtmlTagName);
        }
        return undefined;
    }

    export function isHtmlAttributeNameStart(codePoint: number | undefined): boolean {
        return UnicodeUtils.isAsciiLetter(codePoint)
            || codePoint === CharacterCodes._
            || codePoint === CharacterCodes.colon;
    }

    export function isHtmlAttributeNamePart(codePoint: number | undefined): boolean {
        return isHtmlAttributeNameStart(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint)
            || codePoint === CharacterCodes.dot
            || codePoint === CharacterCodes.minus;
    }

    export function rescanHtmlAttributeName(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#attribute-name
        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);
        const count: number = preprocessor.peekCount(0, isHtmlAttributeNameStart, isHtmlAttributeNamePart);
        if (count > 0) {
            preprocessor.advance(count);
            return scanner.setToken(Token.HtmlAttributeName);
        }
        return undefined;
    }

    export function isHtmlAttributeValuePart(codePoint: number | undefined): boolean {
        return !UnicodeUtils.isAsciiWhitespace(codePoint)
            && codePoint !== CharacterCodes.quoteMark
            && codePoint !== CharacterCodes.apostrophe
            && codePoint !== CharacterCodes.equals
            && codePoint !== CharacterCodes.lessThan
            && codePoint !== CharacterCodes.greaterThan
            && codePoint !== CharacterCodes.backtick
            && codePoint !== undefined;
    }

    export function rescanHtmlAttributeValue(scanner: Scanner, singleLine: boolean): Token | undefined {
        // https://spec.commonmark.org/0.29/#single-quoted-attribute-value
        // https://spec.commonmark.org/0.29/#double-quoted-attribute-value
        // https://spec.commonmark.org/0.29/#unquoted-attribute-value
        const preprocessor: Preprocessor = scanner.preprocessor;
        let quoteChar: number;
        let token: Token;
        switch (scanner.token()) {
            case Token.QuoteMarkToken:
                quoteChar = CharacterCodes.quoteMark;
                token = Token.HtmlDoubleQuotedAttributeValue;
                break;
            case Token.ApostropheToken:
                quoteChar = CharacterCodes.apostrophe;
                token = Token.HtmlSingleQuotedAttributeValue;
                break;
            default:
                preprocessor.setPos(scanner.startPos);
                const count: number = preprocessor.peekCount(0, isHtmlAttributeValuePart);
                if (count > 0) {
                    preprocessor.advance(count);
                    return scanner.setToken(Token.HtmlUnquotedAttributeValue);
                }
                return undefined;
        }

        const pos: number = scanner.pos;
        const count: number = singleLine ? 
            preprocessor.peekCountUntilAny(0, quoteChar, CharacterCodes.lineFeed) :
            preprocessor.peekCountUntilAny(0, quoteChar);
        if (preprocessor.peekIs(count, quoteChar)) {
            preprocessor.advance(count);
            const tokenValue: string = scanner.slice(pos, scanner.pos);
            preprocessor.read();
            return scanner.setToken(token, tokenValue);
        }
        return undefined;
    }

    export function isHtmlEntityNameStart(codePoint: number | undefined): boolean {
        return UnicodeUtils.isAsciiLetter(codePoint);
    }

    export function isHtmlEntityNamePart(codePoint: number | undefined): boolean {
        return isHtmlEntityNameStart(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint);
    }

    export function rescanHtmlCharacterEntity(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#entity-and-numeric-character-references
        if (scanner.token() !== Token.AmpersandToken) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        if (preprocessor.peekIs(0, CharacterCodes.hash)) {
            preprocessor.read();
            if (preprocessor.peekIsAny(0, CharacterCodes.x, CharacterCodes.X)) {
                // hex
                preprocessor.read();
                const count: number | undefined = preprocessor.peekMaxCount(0, 6, UnicodeUtils.isHexDigit);
                if (count !== undefined && count > 0 && preprocessor.peekIs(count, CharacterCodes.semiColon)) {
                    const pos: number = preprocessor.pos;
                    preprocessor.advance(count);
                    let codePoint: number = parseInt(preprocessor.slice(pos, preprocessor.pos), 16);
                    if (!UnicodeUtils.isValidCodePoint(codePoint)) {
                        codePoint = CharacterCodes.replacementCharacter;
                    }
                    preprocessor.read(); // consume the trailing `;`
                    return scanner.setToken(Token.HtmlCharacterEntity, UnicodeUtils.stringFromCodePoint(codePoint));
                }
            } else {
                // decimal
                const count: number | undefined = preprocessor.peekMaxCount(0, 7, UnicodeUtils.isDecimalDigit);
                if (count !== undefined && count > 0 && preprocessor.peekIs(count, CharacterCodes.semiColon)) {
                    const pos: number = preprocessor.pos;
                    preprocessor.advance(count);
                    let codePoint: number = parseInt(preprocessor.slice(pos, preprocessor.pos), 10);
                    if (codePoint === 0 || !UnicodeUtils.isValidCodePoint(codePoint)) {
                        codePoint = CharacterCodes.replacementCharacter;
                    }
                    preprocessor.read(); // consume the trailing `;`
                    return scanner.setToken(Token.HtmlCharacterEntity, UnicodeUtils.stringFromCodePoint(codePoint));
                }
            }
        } else {
            // name
            const count: number | undefined = preprocessor.peekCount(0, isHtmlEntityNameStart, isHtmlEntityNamePart);
            if (count !== undefined && count > 0 && preprocessor.peekIs(count, CharacterCodes.semiColon)) {
                const pos: number = preprocessor.pos;
                preprocessor.advance(count);
                const codePoints: ReadonlyArray<number> | undefined = HtmlUtils.htmlEntityNameToCodePoints(preprocessor.slice(pos, preprocessor.pos));
                if (codePoints !== undefined) {
                    preprocessor.read(); // consume the trailing `;`
                    return scanner.setToken(Token.HtmlCharacterEntity, UnicodeUtils.stringFromCodePoint(...codePoints));
                }
            }
        }
        return undefined;
    }
}