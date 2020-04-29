import { Scanner } from "../Scanner";
import { Token } from "../Token";
import { CharacterCodes } from "../CharacterCodes";
import { Preprocessor } from "../Preprocessor";

export namespace GfmDelimiterScanner {
    export function rescanDelimiterToken(scanner: Scanner): Token | undefined {
        // https://github.github.com/gfm/#strikethrough-extension-
        if (scanner.token() !== Token.TildeToken) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        if (!preprocessor.peekIs(0, CharacterCodes.tilde)) {
            return undefined;
        }

        preprocessor.advance(1);
        return scanner.setToken(Token.TildeTildeToken);
    }
}