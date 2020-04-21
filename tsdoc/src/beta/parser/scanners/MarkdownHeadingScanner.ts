import { Token } from "../Token";
import { Scanner } from "../Scanner";
import { CharacterCodes } from "../CharacterCodes";
import { UnicodeUtils } from "../utils/UnicodeUtils";
import { Preprocessor } from "../Preprocessor";

export namespace MarkdownHeadingScanner {
    /**
     * Rescans the current token to check for an ATX heading token (`#`, `##`, etc.).
     */
    export function rescanAtxHeadingToken(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#atx-heading
        if (scanner.token() === Token.HashToken) {
            const preprocessor: Preprocessor = scanner.preprocessor;
            preprocessor.setPos(scanner.startPos);
            // only # through ###### is permitted as an ATX heading marker.
            const count: number | undefined = preprocessor.peekMaxCount(0, 6, CharacterCodes.hash); 
            if (count !== undefined) {
                // Must be followed by SPACE, TAB, or LINE ENDING
                if (preprocessor.peekIsAny(count,
                    CharacterCodes.space,
                    CharacterCodes.tab,
                    CharacterCodes.lineFeed,
                    undefined /*EOF*/)
                ) {
                    preprocessor.advance(count);
                    return scanner.setToken(Token.AtxHeadingToken);
                }
            }
        }
        return undefined;
    }

    /**
     * Rescans the current token to check for a Setext heading token (`===` or `---`).
     */
    export function rescanSetextHeadingToken(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#setext-heading-underline
        let char: number;
        let token: Token;
        switch (scanner.token()) {
            case Token.EqualsToken:
                char = CharacterCodes.equals;
                token = Token.EqualsSetextHeadingToken;
                break;
            case Token.MinusToken:
                char = CharacterCodes.minus;
                token = Token.MinusSetextHeadingToken;
                break;
            default:
                return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        const markerCount: number = preprocessor.peekCount(0, char);
        const spaceCount: number = preprocessor.peekCount(markerCount, UnicodeUtils.isSpaceOrTab);
        if (preprocessor.peekIsAny(markerCount + spaceCount,
            CharacterCodes.lineFeed,
            undefined /*EOF*/)
        ) {
            preprocessor.advance(markerCount);
            return scanner.setToken(token);
        }
        return undefined;
    }
}
