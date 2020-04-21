import { Scanner } from "../Scanner";
import { CharacterCodes } from "../CharacterCodes";
import { Token } from "../Token";
import { UnicodeUtils } from "../utils/UnicodeUtils";
import { Preprocessor } from "../Preprocessor";

export namespace TsDocBlockTagScanner {
    export function isTsDocTagNameStart(codePoint: number | undefined): boolean {
        return UnicodeUtils.isAsciiLetter(codePoint);
    }
    
    export function isTsDocTagNamePart(codePoint: number | undefined): boolean {
        return isTsDocTagNameStart(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint)
            || codePoint === CharacterCodes._;
    }

    export function rescanTsDocTagName(scanner: Scanner): Token | undefined {
        if (scanner.token() === Token.AtToken) {
            const preprocessor: Preprocessor = scanner.preprocessor;
            const count: number = preprocessor.peekCount(0, isTsDocTagNameStart, isTsDocTagNamePart);
            if (count > 0) {
                preprocessor.advance(count);
                return scanner.setToken(Token.DocTagName);
            }
        }
        return undefined;
    }
}
