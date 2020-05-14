export type TokenLike = Token | symbol;

export enum Token {
    Unknown,
    EndOfFileToken,

    // Whitespace
    NewLineTrivia,                      // \r (or) \n (or) \r\n
    SpaceTrivia,                        // " "
    TabTrivia,                          // \t
    PartialTabTrivia,                   // zero-width trivia indicating a single column preceding a tab stop
    OtherAsciiWhitespaceTrivia,         // \v
    OtherUnicodeWhitespaceTrivia,       // Unicode category Zs, \f

    // Punctuation
    // - ASCII Punctuation Characters
    ExclamationToken,                   // !
    QuoteMarkToken,                     // "
    HashToken,                          // #
    DollarToken,                        // $
    PercentToken,                       // %
    AmpersandToken,                     // &
    ApostropheToken,                    // '
    OpenParenToken,                     // (
    CloseParenToken,                    // )
    AsteriskToken,                      // *
    PlusToken,                          // +
    CommaToken,                         // ,
    MinusToken,                         // -
    DotToken,                           // .
    SlashToken,                         // /
    ColonToken,                         // :
    SemiColonToken,                     // ;
    LessThanToken,                      // <
    EqualsToken,                        // =
    GreaterThanToken,                   // >
    QuestionToken,                      // ?
    AtToken,                            // @
    OpenBracketToken,                   // [
    BackslashToken,                     // \
    CloseBracketToken,                  // ]
    CaretToken,                         // ^
    UnderscoreToken,                    // _
    BacktickToken,                      // `
    OpenBraceToken,                     // {
    BarToken,                           // |
    CloseBraceToken,                    // }
    TildeToken,                         // ~
    // - Punctuation Characters
    UnicodePunctuationToken,            // Unicode categories Pc, Pd, Pe, Pf, Pi, Po, or Ps

    // Other
    DecimalDigits,                      // 0-9
    Text,
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Token {
    // https://spec.commonmark.org/0.29/#line-ending
    export type LineEnding =
        | Token.NewLineTrivia
        ;

    // https://spec.commonmark.org/0.29/#line-ending
    export function isLineEnding(token: TokenLike): token is Token.LineEnding | Token.EndOfFileToken {
        return token === Token.NewLineTrivia
            || token === Token.EndOfFileToken;
    }

    // https://spec.commonmark.org/0.29/#whitespace-character
    export type WhitespaceCharacter =
        | Token.SpaceTrivia
        | Token.TabTrivia
        | Token.PartialTabTrivia
        | Token.OtherAsciiWhitespaceTrivia
        ;

    // https://spec.commonmark.org/0.29/#whitespace-character
    export function isWhitespaceCharacter(token: TokenLike): token is Token.WhitespaceCharacter {
        return token === Token.SpaceTrivia
            || token === Token.TabTrivia
            || token === Token.PartialTabTrivia
            || token === Token.OtherAsciiWhitespaceTrivia;
    }

    // https://spec.commonmark.org/0.29/#unicode-whitespace-character
    export type UnicodeWhitespaceCharacter =
        | Token.WhitespaceCharacter
        | Token.OtherUnicodeWhitespaceTrivia
        ;

    // https://spec.commonmark.org/0.29/#unicode-whitespace-character
    export function isUnicodeWhitespaceCharacter(token: TokenLike): token is Token.UnicodeWhitespaceCharacter {
        return isWhitespaceCharacter(token)
            || token === Token.OtherUnicodeWhitespaceTrivia;
    }

    // https://spec.commonmark.org/0.29/#space
    export type Space =
        | Token.SpaceTrivia
        ;

    // https://spec.commonmark.org/0.29/#space
    export function isSpace(token: TokenLike): token is Token.Space {
        return token === Token.SpaceTrivia;
    }

    export type IndentCharacter =
        | Token.SpaceTrivia
        | Token.TabTrivia
        | Token.PartialTabTrivia
        ;

    export function isIndentCharacter(token: TokenLike): token is Token.IndentCharacter {
        return token === Token.SpaceTrivia
            || token === Token.TabTrivia
            || token === Token.PartialTabTrivia;
    }

    // https://spec.commonmark.org/0.29/#non-whitespace-character
    export type NonWhitespaceCharacter =
        | Exclude<Token, Token.WhitespaceCharacter>
        ;

    // https://spec.commonmark.org/0.29/#non-whitespace-character
    export function isNonWhitespaceCharacter(token: TokenLike): token is Token.NonWhitespaceCharacter {
        return !isWhitespaceCharacter(token);
    }

    // https://spec.commonmark.org/0.29/#ascii-punctuation-character
    export type AsciiPunctuationCharacter =
        | Token.ExclamationToken
        | Token.QuoteMarkToken
        | Token.HashToken
        | Token.DollarToken
        | Token.PercentToken
        | Token.AmpersandToken
        | Token.ApostropheToken
        | Token.OpenParenToken
        | Token.CloseParenToken
        | Token.AsteriskToken
        | Token.PlusToken
        | Token.CommaToken
        | Token.MinusToken
        | Token.DotToken
        | Token.SlashToken
        | Token.ColonToken
        | Token.SemiColonToken
        | Token.LessThanToken
        | Token.EqualsToken
        | Token.GreaterThanToken
        | Token.QuestionToken
        | Token.AtToken
        | Token.OpenBracketToken
        | Token.BackslashToken
        | Token.CloseBracketToken
        | Token.CaretToken
        | Token.UnderscoreToken
        | Token.BacktickToken
        | Token.OpenBraceToken
        | Token.BarToken
        | Token.CloseBraceToken
        | Token.TildeToken
        ;

    // https://spec.commonmark.org/0.29/#ascii-punctuation-character
    export function isAsciiPunctuationCharacter(token: TokenLike): token is Token.AsciiPunctuationCharacter {
        return token === Token.ExclamationToken
            || token === Token.QuoteMarkToken
            || token === Token.HashToken
            || token === Token.DollarToken
            || token === Token.PercentToken
            || token === Token.AmpersandToken
            || token === Token.ApostropheToken
            || token === Token.OpenParenToken
            || token === Token.CloseParenToken
            || token === Token.AsteriskToken
            || token === Token.PlusToken
            || token === Token.CommaToken
            || token === Token.MinusToken
            || token === Token.DotToken
            || token === Token.SlashToken
            || token === Token.ColonToken
            || token === Token.SemiColonToken
            || token === Token.LessThanToken
            || token === Token.EqualsToken
            || token === Token.GreaterThanToken
            || token === Token.QuestionToken
            || token === Token.AtToken
            || token === Token.OpenBracketToken
            || token === Token.BackslashToken
            || token === Token.CloseBracketToken
            || token === Token.CaretToken
            || token === Token.UnderscoreToken
            || token === Token.BacktickToken
            || token === Token.OpenBraceToken
            || token === Token.BarToken
            || token === Token.CloseBraceToken
            || token === Token.TildeToken;
    }

    // https://spec.commonmark.org/0.29/#punctuation-character
    export type PunctuationCharacter =
        | Token.AsciiPunctuationCharacter
        | Token.UnicodePunctuationToken
        ;

    // https://spec.commonmark.org/0.29/#punctuation-character
    export function isPunctuationCharacter(token: TokenLike): token is Token.PunctuationCharacter {
        return isAsciiPunctuationCharacter(token)
            || token === Token.UnicodePunctuationToken;
    }

    export type TextLike =
        | Token.Text
        | Token.DecimalDigits
        ;

    export function isTextLike(token: TokenLike): token is Token.TextLike {
        return token === Token.Text
            || token === Token.DecimalDigits;
    }
}