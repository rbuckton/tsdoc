import { Token } from "../Token";
import { Scanner } from "../Scanner";
import { CharacterCodes } from "../CharacterCodes";
import { Preprocessor } from "../Preprocessor";

export namespace MarkdownCodeInlineScanner {
    export function rescanBacktickString(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#backtick-string
        if (scanner.token() !== Token.BacktickToken) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);

        // scan the number of backticks
        const backtickCount: number = preprocessor.peekCount(0, CharacterCodes.backtick);
        preprocessor.advance(backtickCount);

        return scanner.setToken(Token.BacktickString);
    }

    export function rescanCodeSpan(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#code-span
        if (scanner.token() !== Token.BacktickToken &&
            scanner.token() !== Token.BacktickString) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);

        // scan the number of backticks
        const backtickCount: number = preprocessor.peekCount(0, CharacterCodes.backtick);
        preprocessor.advance(backtickCount);

        let tokenValue: string = "";
        let pos: number = preprocessor.pos;
        let codePoint: number | undefined;
        const hasLeadingSpace: boolean = preprocessor.peekIsAny(0,
            CharacterCodes.space,
            CharacterCodes.lineFeed);
        let hasTrailingSpace: boolean = false;
        let hasNonSpace: boolean = false;
        for (;;) {
            codePoint = preprocessor.peek();
            if (codePoint === undefined) {
                // unterminated
                return undefined;
            }

            if (codePoint === CharacterCodes.backtick) {
                const count: number = preprocessor.peekCount(0, CharacterCodes.backtick);
                if (count === backtickCount) {
                    break;
                }

                // consume this run of backticks so that we don't check it again.
                hasNonSpace = true;
                hasTrailingSpace = false;
                preprocessor.advance(count);
                continue;
            }

            if (codePoint === CharacterCodes.lineFeed) {
                // consume the string up to this point
                tokenValue += preprocessor.slice(pos, preprocessor.pos);

                // convert line feeds into single spaces
                tokenValue += " ";
                preprocessor.read();
                pos = preprocessor.pos;
                hasTrailingSpace = true;
                continue;
            }

            // update whether the last consumed codepoint was a space
            if (codePoint === CharacterCodes.space) {
                hasTrailingSpace = true;
            } else {
                hasTrailingSpace = false;
                hasNonSpace = true;
            }

            // consume the character
            preprocessor.read();
        }

        // consume the remainder of the string.
        tokenValue += preprocessor.slice(pos, preprocessor.pos);

        // trim the leading and trailing space character if the string contains non-space characters.
        if (hasLeadingSpace && hasTrailingSpace && hasNonSpace) {
            tokenValue = tokenValue.slice(1, -1);
        }

        preprocessor.advance(backtickCount);
        return scanner.setToken(Token.CodeSpan, tokenValue);
    }
}