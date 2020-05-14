import { InlineParser } from "../../../parser/InlineParser";
import { Token, TokenLike } from "../../../parser/Token";
import { Run } from "../../../nodes/Run";
import { Scanner } from "../../../parser/Scanner";
import { Preprocessor } from "../../../parser/Preprocessor";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { Inline } from "../../../nodes/Inline";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IInlineSyntax } from "../../IInlineSyntax";

export namespace MarkdownBackslashEscapeSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<IInlineSyntax>(MarkdownBackslashEscapeSyntax);

    export const backslashEscapeCharacterToken = Symbol('BackslashEscapeCharacterToken'); // \\ (or other escapes)

    export function rescanBackslashEscape(scanner: Scanner): TokenLike | undefined {
        const preprocessor: Preprocessor = scanner.preprocessor;
        if (scanner.token() !== Token.BackslashToken ||
            !preprocessor.peekIs(0, UnicodeUtils.isAsciiPunctuation)) {
            return undefined
        }

        const codePoint: number = preprocessor.read()!;
        return scanner.setToken(backslashEscapeCharacterToken, UnicodeUtils.stringFromCodePoint(codePoint));
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
        // https://spec.commonmark.org/0.29/#backslash-escapes
        const scanner: Scanner = parser.scanner;
        if (scanner.rescan(rescanBackslashEscape) !== backslashEscapeCharacterToken) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        const text: string = scanner.getTokenValue();
        scanner.scan();

        return new Run({ pos, end, text });
    }
}