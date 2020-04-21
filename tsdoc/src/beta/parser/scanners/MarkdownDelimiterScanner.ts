import { Scanner } from "../Scanner";
import { Token } from "../Token";
import { CharacterCodes } from "../CharacterCodes";
import { Preprocessor } from "../Preprocessor";

export namespace MarkdownDelimiterScanner {
    export function rescanDelimiterToken(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#delimiter-run
        let char: number;
        let token: Token;
        switch (scanner.token()) {
            case Token.AsteriskToken: 
                char = CharacterCodes.asterisk;
                token = Token.AsteriskEmphasisToken;
                break;
            case Token.UnderscoreToken: 
                char = CharacterCodes._;
                token = Token.UnderscoreEmphasisToken;
                break;
            default:
                return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        const count: number = preprocessor.peekCount(0, char);
        preprocessor.advance(count);
        return scanner.setToken(token);
    }
}