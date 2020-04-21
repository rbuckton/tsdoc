import { Token } from "../Token";
import { Scanner } from "../Scanner";
import { CharacterCodes } from "../CharacterCodes";
import { Preprocessor } from "../Preprocessor";

export namespace MarkdownCodeBlockScanner {
    /**
     * Rescans the current token to check for a markdown code fence token (` ``` ` or `~~~`).
     *
     * NOTE: This is expected to be called by `Scanner.prototype.rescan` and *does not reset scanner state*.
     */
    export function rescanCodeFenceToken(scanner: Scanner): Token | undefined {
        // https://spec.commonmark.org/0.29/#code-fence
        let fenceChar: number;
        let fenceToken: Token;
        switch (scanner.token()) {
            case Token.BacktickToken:
                fenceChar = CharacterCodes.backtick;
                fenceToken = Token.BacktickCodeFenceToken;
                break;
            case Token.TildeToken:
                fenceChar = CharacterCodes.tilde;
                fenceToken = Token.TildeCodeFenceToken;
                break;
            default:
                return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);

        // A code fence must have at least 3 fence characters.
        const count: number | undefined = preprocessor.peekMinCount(0, 3, fenceChar);
        if (count !== undefined) {
            preprocessor.advance(count);
            return scanner.setToken(fenceToken);
        }

        return undefined;
    }

    /**
     * Looks ahead to determine if there is a backtick character (`` ` ``) on the rest of the current line.
     *
     * NOTE: This is expected to be called by `Scanner.prototype.lookAhead` and *does not reset scanner state*.
     */
    export function lookAheadHasBacktickOnCurrentLine(scanner: Scanner): boolean {
        for (;;) {
            switch (scanner.scan()) {
                case Token.NewLineTrivia:
                case Token.EndOfFileToken:
                    return false;
                case Token.BacktickToken:
                    return true;
            }
        }
    }

    /**
     * Looks ahead to determine if there are only space characters (if any) on the rest of the current line.
     *
     * NOTE: This is expected to be called by `Scanner.prototype.lookAhead` and *does not reset scanner state*.
     */
    export function lookAheadHasOnlySpacesOnCurrentLine(scanner: Scanner): boolean {
        for (;;) {
            switch (scanner.scan()) {
                case Token.NewLineTrivia:
                case Token.EndOfFileToken:
                    return true;
                case Token.SpaceTrivia:
                    continue;
                default:
                    return false;
            }
        }
    }
}