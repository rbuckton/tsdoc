import { Scanner } from "../Scanner";
import { Token } from "../Token";
import { Preprocessor } from "../Preprocessor";
import { CharacterCodes } from "../CharacterCodes";

export namespace MarkdownLineBreakScanner {
    export function rescanLineBreak(scanner: Scanner): Token | undefined {
        const preprocessor: Preprocessor = scanner.preprocessor;
        switch (scanner.token()) {
            case Token.SpaceTrivia:
                if (preprocessor.peekIsSequence(0,
                    CharacterCodes.space,
                    CharacterCodes.lineFeed)
                ) {
                    preprocessor.advance(2);
                    return scanner.setToken(Token.SpaceSpaceHardBreakToken);
                }
                break;
            case Token.BackslashToken:
                if (preprocessor.peekIs(0, CharacterCodes.lineFeed)) {
                    preprocessor.advance(1);
                    return scanner.setToken(Token.BackslashHardBreakToken);
                }
                break;
        }
        return undefined;
    }
}