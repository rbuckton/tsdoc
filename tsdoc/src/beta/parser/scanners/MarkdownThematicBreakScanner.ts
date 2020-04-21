import { Token } from "../Token";
import { Scanner } from "../Scanner";
import { CharacterCodes } from "../CharacterCodes";
import { UnicodeUtils } from "../utils/UnicodeUtils";
import { Preprocessor } from "../Preprocessor";

export namespace MarkdownThematicBreakScanner {
    export function rescanThematicBreakToken(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#thematic-break
        let breakChar: number;
        let breakToken: Token;
        switch (scanner.token()) {
            case Token.AsteriskToken:
                breakChar = CharacterCodes.asterisk
                breakToken = Token.AsteriskThematicBreakToken;
                break;
            case Token.UnderscoreToken:
                breakChar = CharacterCodes._
                breakToken = Token.UnderscoreThematicBreakToken;
                break;
            case Token.MinusToken:
                breakChar = CharacterCodes.minus
                breakToken = Token.MinusThematicBreakToken;
                break;
            default:
                return undefined;
        }
        const preprocessor: Preprocessor = scanner.preprocessor;
        let breakLookAhead: number = 0;
        let spaceLookAhead: number = 0;
        for (;;) {
            const spaceCount: number = preprocessor.peekCount(spaceLookAhead + breakLookAhead, UnicodeUtils.isSpaceOrTab);
            spaceLookAhead += spaceCount;

            const breakCount: number = preprocessor.peekCount(spaceLookAhead + breakLookAhead, breakChar);
            if (breakCount === 0) {
                break;
            }

            breakLookAhead += breakCount;
        }
        if (breakLookAhead >= 2 && preprocessor.peekIsAny(breakLookAhead + spaceLookAhead,
            CharacterCodes.lineFeed,
            undefined /*EOF*/)) {
            preprocessor.advance(breakLookAhead + spaceLookAhead);
            return scanner.setToken(breakToken);
        }
        return undefined;
    }
}
