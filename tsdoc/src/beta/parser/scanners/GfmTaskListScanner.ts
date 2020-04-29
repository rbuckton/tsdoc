import { Token } from "../Token";
import { Scanner } from "../Scanner";
import { CharacterCodes } from "../CharacterCodes";
import { Preprocessor } from "../Preprocessor";

export namespace GfmTaskListScanner {
    function isX(codePoint: number | undefined): boolean {
        return codePoint === CharacterCodes.x
            || codePoint === CharacterCodes.X;
    }

    export function rescanTaskListToken(scanner: Scanner): Token | undefined {
        // https://github.github.com/gfm/#task-list-item-marker
        if (scanner.token() !== Token.OpenBracketToken) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        if (preprocessor.peekIsSequence(0, CharacterCodes.space, CharacterCodes.closeBracket)) {
            preprocessor.advance(2);
            return scanner.setToken(Token.UncheckedTaskListMarkerToken);
        }
        if (preprocessor.peekIsSequence(0, isX, CharacterCodes.closeBracket)) {
            preprocessor.advance(2);
            return scanner.setToken(Token.CheckedTaskListMarkerToken);
        }
        return undefined;
    }
}
