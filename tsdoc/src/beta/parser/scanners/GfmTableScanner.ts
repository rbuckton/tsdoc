import { Token } from "../Token";
import { Scanner } from "../Scanner";
import { CharacterCodes } from "../CharacterCodes";
import { UnicodeUtils } from "../utils/UnicodeUtils";
import { Preprocessor } from "../Preprocessor";

export namespace GfmTableScanner {
    export function rescanTableDelimiterToken(scanner: Scanner): Token | undefined {
        // https://github.github.com/gfm/#delimiter-row
        if (scanner.token() !== Token.MinusToken &&
            scanner.token() !== Token.ColonToken) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        const leftColon: boolean = scanner.token() === Token.ColonToken;
        const minusLookahead: number = preprocessor.peekCount(0, CharacterCodes.minus);
        if (leftColon && minusLookahead === 0) {
            return undefined;
        }

        const rightColon: boolean = preprocessor.peekIs(minusLookahead, CharacterCodes.colon);
        if (!preprocessor.peekIsAny(minusLookahead + (rightColon ? 1 : 0), 
            UnicodeUtils.isSpaceOrTab,
            UnicodeUtils.isLineTerminator,
            CharacterCodes.bar,
            /*eof*/ undefined)) {
            return undefined;
        }

        preprocessor.advance(minusLookahead + (rightColon ? 1 : 0));
        return scanner.setToken(
            leftColon && rightColon ? Token.CenterAlignedTableDelimiterToken :
            leftColon ? Token.LeftAlignedTableDelimiterToken :
            rightColon ? Token.RightAlignedTableDelimiterToken :
            Token.UnalignedTableDelimiterToken
        );
    }
}
