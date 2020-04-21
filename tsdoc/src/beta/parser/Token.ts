export enum Token {
    Unknown,
    EndOfFileToken,

    // Whitespace
    NewLineTrivia,                  // \r (or) \n (or) \r\n
    SpaceTrivia,                    // " "
    TabTrivia,                      // \t
    OtherAsciiWhitespaceTrivia,     // \r, \n, \v
    OtherUnicodeWhitespaceTrivia,   // Unicode category Zs, \t, \r, \n, \f

    // Punctuation
    // - ASCII Punctuation Characters
    ExclamationToken,               // !
    QuoteMarkToken,                 // "
    HashToken,                      // #
    DollarToken,                    // $
    PercentToken,                   // %
    AmpersandToken,                 // &
    ApostropheToken,                // '
    OpenParenToken,                 // (
    CloseParenToken,                // )
    AsteriskToken,                  // *
    PlusToken,                      // +
    CommaToken,                     // ,
    MinusToken,                     // -
    DotToken,                       // .
    SlashToken,                     // /
    ColonToken,                     // :
    SemiColonToken,                 // ;
    LessThanToken,                  // <
    EqualsToken,                    // =
    GreaterThanToken,               // >
    QuestionToken,                  // ?
    AtToken,                        // @
    OpenBracketToken,               // [
    BackslashToken,                 // \
    CloseBracketToken,              // ]
    CaretToken,                     // ^
    UnderscoreToken,                // _
    BacktickToken,                  // `
    OpenBraceToken,                 // {
    BarToken,                       // |
    CloseBraceToken,                // }
    TildeToken,                     // ~
    // - Punctuation Characters
    UnicodePunctuationToken,        // Unicode categories Pc, Pd, Pe, Pf, Pi, Po, or Ps

    // Other
    DecimalDigits,                  // 0-9
    Text,

    // TSDoc tokens
    DocTagName,                     // param, type, etc.

    // Markdown Tokens
    PartialTabTrivia,               // zero-width trivia indicating a single column preceding a tab stop
    AtxHeadingToken,                // #{1,6}
    BacktickCodeFenceToken,         // `{3,}
    TildeCodeFenceToken,            // ~{3,}
    EqualsSetextHeadingToken,       // =====
    MinusSetextHeadingToken,        // -----
    AsteriskThematicBreakToken,     // ***
    MinusThematicBreakToken,        // ---
    UnderscoreThematicBreakToken,   // ___
    OrderedListNumberLiteral,       // a decimal number preceding a . or a )
    LinkLabelToken,                 // [abc]
    LinkDestinationToken,           // <abc> or http://foo
    LinkTitleToken,                 // "abc" or 'abc' or (abc)
    SpaceSpaceHardBreakToken,       // (space)(space)\n
    BackslashHardBreakToken,        // (backslash)\n
    ExclamationOpenBracketToken,    // ![
    AsteriskEmphasisToken,          // * or ** or ***
    UnderscoreEmphasisToken,        // _ or __ or ___
    AbsoluteUri,                    // scheme:uri
    EmailAddress,                   // user@domain
    BacktickString,                 // ` or `` or ``` ...
    CodeSpan,                       // `a` or `` a`b `` ...
    BackslashEscapeCharacter,       // \\ (or other escapes)

    // Html Tokens
    HtmlProcessingInstructionStartToken,    // <?
    HtmlProcessingInstructionEndToken,      // ?>
    HtmlEndTagStartToken,                   // </
    HtmlSelfClosingTagEndToken,             // />
    HtmlDeclarationStartToken,              // <!
    HtmlCharacterDataStartToken,            // <![CDATA[
    HtmlCharacterDataEndToken,              // ]]>
    HtmlCommentStartToken,                  // <!--
    HtmlCommentEndToken,                    // -->
    HtmlCommentMinusMinusToken,                // --
    HtmlTagName,                            // a, html, etc.
    HtmlAttributeName,                      // src, href, etc.
    HtmlSingleQuotedAttributeValue,         // 'abc'
    HtmlDoubleQuotedAttributeValue,         // "abc"
    HtmlUnquotedAttributeValue,             // abc
    HtmlCharacterEntity,                    // &amp; or &#32; or &#x20; ...
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Token {
    // https://spec.commonmark.org/0.29/#line-ending
    export type LineEnding =
        | Token.NewLineTrivia
        ;

    // https://spec.commonmark.org/0.29/#line-ending
    export function isLineEnding(token: Token): token is Token.LineEnding | Token.EndOfFileToken {
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
    export function isWhitespaceCharacter(token: Token): token is Token.WhitespaceCharacter {
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
    export function isUnicodeWhitespaceCharacter(token: Token): token is Token.UnicodeWhitespaceCharacter {
        return isWhitespaceCharacter(token)
            || token === Token.OtherUnicodeWhitespaceTrivia;
    }

    // https://spec.commonmark.org/0.29/#space
    export type Space =
        | Token.SpaceTrivia
        ;

    // https://spec.commonmark.org/0.29/#space
    export function isSpace(token: Token): token is Token.Space {
        return token === Token.SpaceTrivia;
    }

    export type IndentCharacter =
        | Token.SpaceTrivia
        | Token.TabTrivia
        | Token.PartialTabTrivia
        ;

    export function isIndentCharacter(token: Token): token is Token.IndentCharacter {
        return token === Token.SpaceTrivia
            || token === Token.TabTrivia
            || token === Token.PartialTabTrivia;
    }

    // https://spec.commonmark.org/0.29/#non-whitespace-character
    export type NonWhitespaceCharacter =
        | Exclude<Token, Token.WhitespaceCharacter>
        ;

    // https://spec.commonmark.org/0.29/#non-whitespace-character
    export function isNonWhitespaceCharacter(token: Token): token is Token.NonWhitespaceCharacter {
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
    export function isAsciiPunctuationCharacter(token: Token): token is Token.AsciiPunctuationCharacter {
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
    export function isPunctuationCharacter(token: Token): token is Token.PunctuationCharacter {
        return isAsciiPunctuationCharacter(token)
            || token === Token.UnicodePunctuationToken;
    }

    export type CodeFence =
        | Token.BacktickCodeFenceToken
        | Token.TildeCodeFenceToken
        ;

    export function isCodeFence(token: Token): token is Token.CodeFence {
        return token === Token.BacktickCodeFenceToken
            || token === Token.TildeCodeFenceToken;
    }

    export type SetextHeading =
        | Token.EqualsSetextHeadingToken
        | Token.MinusSetextHeadingToken
        ;

    export function isSetextHeading(token: Token): token is Token.SetextHeading {
        return token === Token.EqualsSetextHeadingToken
            || token === Token.MinusSetextHeadingToken;
    }

    export type Heading =
        | Token.AtxHeadingToken
        | Token.SetextHeading
        ;

    export function isHeading(token: Token): token is Token.Heading {
        return token === Token.AtxHeadingToken
            || isSetextHeading(token);
    }

    export type ThematicBreak =
        | Token.AsteriskThematicBreakToken
        | Token.MinusThematicBreakToken
        | Token.UnderscoreThematicBreakToken
        ;

    export function isThematicBreak(token: Token): token is Token.ThematicBreak {
        return token === Token.AsteriskThematicBreakToken
            || token === Token.MinusThematicBreakToken
            || token === Token.UnderscoreThematicBreakToken;
    }

    export type UnorderedListItemBullet =
        | Token.AsteriskToken
        | Token.PlusToken
        | Token.MinusToken
        ;

    export function isUnorderedListItemBullet(token: Token): token is Token.UnorderedListItemBullet {
        return token === Token.AsteriskToken
            || token === Token.PlusToken
            || token === Token.MinusToken;
    }

    export type OrderedListItemBullet =
        | Token.CloseParenToken
        | Token.DotToken
        ;

    export function isOrderedListItemBullet(token: Token): token is Token.OrderedListItemBullet {
        return token === Token.CloseParenToken
            || token === Token.DotToken;
    }

    export type ListItemBullet =
        | Token.UnorderedListItemBullet
        | Token.OrderedListItemBullet
        ;

    export function isListItemBullet(token: Token): token is Token.ListItemBullet {
        return isUnorderedListItemBullet(token)
            || isOrderedListItemBullet(token);
    }

    export type HtmlAttributeValue =
        | Token.HtmlSingleQuotedAttributeValue
        | Token.HtmlDoubleQuotedAttributeValue
        | Token.HtmlUnquotedAttributeValue
        ;

    export function isHtmlAttributeValue(token: Token): token is Token.HtmlAttributeValue {
        return token === Token.HtmlSingleQuotedAttributeValue
            || token === Token.HtmlDoubleQuotedAttributeValue
            || token === Token.HtmlUnquotedAttributeValue;
    }

    export type HtmlStartToken =
        | Token.LessThanToken
        | Token.HtmlProcessingInstructionStartToken
        | Token.HtmlEndTagStartToken
        | Token.HtmlDeclarationStartToken
        | Token.HtmlCharacterDataStartToken
        | Token.HtmlCommentStartToken
        ;

    export function isHtmlStartToken(token: Token): token is Token.HtmlStartToken {
        return token === Token.LessThanToken
            || token === Token.HtmlProcessingInstructionStartToken
            || token === Token.HtmlEndTagStartToken
            || token === Token.HtmlDeclarationStartToken
            || token === Token.HtmlCharacterDataStartToken
            || token === Token.HtmlCommentStartToken;
    }

    export type HtmlEndToken =
        | Token.GreaterThanToken
        | Token.HtmlProcessingInstructionEndToken
        | Token.HtmlSelfClosingTagEndToken
        | Token.HtmlCharacterDataEndToken
        | Token.HtmlCommentEndToken
        ;

    export function isHtmlEndToken(token: Token): token is Token.HtmlEndToken {
        return token === Token.GreaterThanToken
            || token === Token.HtmlProcessingInstructionEndToken
            || token === Token.HtmlSelfClosingTagEndToken
            || token === Token.HtmlCharacterDataEndToken
            || token === Token.HtmlCommentEndToken;
    }

    export type TextLike =
        | Token.Text
        | Token.DecimalDigits
        ;

    export function isTextLike(token: Token): token is Token.TextLike {
        return token === Token.Text
            || token === Token.DecimalDigits;
    }

    export type HardBreakToken =
        | Token.SpaceSpaceHardBreakToken
        | Token.BackslashHardBreakToken
        ;

    export function isHardBreakToken(token: Token): token is Token.HardBreakToken {
        return token === Token.SpaceSpaceHardBreakToken
            || token === Token.BackslashHardBreakToken;
    }

    export type EmphasisToken =
        | Token.AsteriskEmphasisToken
        | Token.UnderscoreEmphasisToken
        ;

    export function isEmphasisToken(token: Token): token is Token.EmphasisToken {
        return token === Token.AsteriskEmphasisToken
            || token === Token.UnderscoreEmphasisToken;
    }
}