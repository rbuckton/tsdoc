import { Scanner } from "../Scanner";
import { Token } from "../Token";
import { Preprocessor } from "../Preprocessor";
import { CharacterCodes } from "../CharacterCodes";

export namespace MarkdownBracketScanner {
    export function rescanExclamationOpenBracket(scanner: Scanner): Token | undefined {
        if (scanner.token() === Token.ExclamationToken) {
            const preprocessor: Preprocessor = scanner.preprocessor;
            if (preprocessor.peekIs(0, CharacterCodes.openBracket)) {
                preprocessor.read();
                return scanner.setToken(Token.ExclamationOpenBracketToken);
            }
        }
        return undefined;
    }
}