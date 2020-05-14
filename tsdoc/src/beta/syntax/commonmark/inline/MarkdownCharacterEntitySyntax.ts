import { InlineParser } from "../../../parser/InlineParser";
import { Run } from "../../../nodes/Run";
import { Scanner } from "../../../parser/Scanner";
import { Token, TokenLike } from "../../../parser/Token";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { Preprocessor } from "../../../parser/Preprocessor";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { HtmlUtils } from "../../../utils/HtmlUtils";
import { Inline } from "../../../nodes/Inline";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IInlineSyntax } from "../../IInlineSyntax";

export namespace MarkdownCharacterEntitySyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<IInlineSyntax>(MarkdownCharacterEntitySyntax);

    const htmlCharacterEntity = Symbol("HtmlCharacterEntity");  // &amp; or &#32; or &#x20; ...

    function isHtmlEntityNameStart(codePoint: number | undefined): boolean {
        return UnicodeUtils.isAsciiLetter(codePoint);
    }

    function isHtmlEntityNamePart(codePoint: number | undefined): boolean {
        return isHtmlEntityNameStart(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint);
    }

    function rescanHtmlCharacterEntity(scanner: Scanner): TokenLike | undefined {
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
                    return scanner.setToken(htmlCharacterEntity, UnicodeUtils.stringFromCodePoint(codePoint));
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
                    return scanner.setToken(htmlCharacterEntity, UnicodeUtils.stringFromCodePoint(codePoint));
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
                    return scanner.setToken(htmlCharacterEntity, UnicodeUtils.stringFromCodePoint(...codePoints));
                }
            }
        }
        return undefined;
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
        // https://spec.commonmark.org/0.29/#entity-and-numeric-character-references
        const scanner: Scanner = parser.scanner;
        if (scanner.rescan(rescanHtmlCharacterEntity) !== htmlCharacterEntity) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        const text: string = scanner.getTokenValue();
        scanner.scan();

        return new Run({ pos, end, text });
    }
}