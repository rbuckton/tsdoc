import { Scanner } from "../Scanner";
import { Token } from "../Token";
import { Preprocessor } from "../Preprocessor";
import { UnicodeUtils } from "../utils/UnicodeUtils";

export namespace MarkdownBackslashEscapeScanner {
    export function rescanBackslashEscape(scanner: Scanner): Token | undefined {
        if (scanner.token() === Token.BackslashToken) {
            const preprocessor: Preprocessor = scanner.preprocessor;
            if (preprocessor.peekIs(0, UnicodeUtils.isAsciiPunctuation)) {
                const codePoint: number = preprocessor.read()!;
                return scanner.setToken(Token.BackslashEscapeCharacter, UnicodeUtils.stringFromCodePoint(codePoint));
            }
        }
        return undefined;
    }
}