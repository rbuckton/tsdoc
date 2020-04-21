import { Token } from "../../Token";
import { Scanner } from "../../Scanner";
import { MarkdownHtmlScanner } from "../MarkdownHtmlScanner";

it.each`
    source         | token
    ${"<?"}        | ${Token.HtmlProcessingInstructionStartToken}
    ${"<!--"}      | ${Token.HtmlCommentStartToken}
    ${"<!"}        | ${Token.LessThanToken}
    ${"<!A"}       | ${Token.HtmlDeclarationStartToken}
    ${"<![CDATA["} | ${Token.HtmlCharacterDataStartToken}
    ${"</"}        | ${Token.HtmlEndTagStartToken}
`('rescanHtmlStartToken: "$source"', ({ source, token }: { source: string, token: Token }) => {
    const scanner: Scanner = new Scanner(source);
    scanner.scan();
    expect(scanner.rescan(MarkdownHtmlScanner.rescanHtmlStartToken)).toBe(token);
});

it.each`
    source   | token
    ${"?>"}  | ${Token.HtmlProcessingInstructionEndToken}
    ${"-->"} | ${Token.HtmlCommentEndToken}
    ${"]]>"} | ${Token.HtmlCharacterDataEndToken}
    ${"/>"}  | ${Token.HtmlSelfClosingTagEndToken}
`('rescanHtmlEndToken: "$source"', ({ source, token }: { source: string, token: Token }) => {
    const scanner: Scanner = new Scanner(source);
    scanner.scan();
    expect(scanner.rescan(MarkdownHtmlScanner.rescanHtmlEndToken)).toBe(token);
});

it.each`
    source  | token
    ${"a"}  | ${Token.HtmlTagName}
    ${"A"}  | ${Token.HtmlTagName}
    ${"a0"} | ${Token.HtmlTagName}
    ${"a-"} | ${Token.HtmlTagName}
    ${"-"}  | ${Token.MinusToken}
    ${"0"}  | ${Token.DecimalDigits}
`('rescanHtmlTagName: "$source"', ({ source, token }: { source: string, token: Token }) => {
    const scanner: Scanner = new Scanner(source);
    scanner.scan();
    expect(scanner.rescan(MarkdownHtmlScanner.rescanHtmlTagName)).toBe(token);
});

it.each`
    source  | token
    ${"a"}  | ${Token.HtmlAttributeName}
    ${"A"}  | ${Token.HtmlAttributeName}
    ${"_"}  | ${Token.HtmlAttributeName}
    ${":"}  | ${Token.HtmlAttributeName}
    ${"a0"} | ${Token.HtmlAttributeName}
    ${"a-"} | ${Token.HtmlAttributeName}
    ${"a_"} | ${Token.HtmlAttributeName}
    ${"a:"} | ${Token.HtmlAttributeName}
    ${"a."} | ${Token.HtmlAttributeName}
    ${"-"}  | ${Token.MinusToken}
    ${"0"}  | ${Token.DecimalDigits}
    ${"."}  | ${Token.DotToken}
`('rescanHtmlAttributeName: "$source"', ({ source, token }: { source: string, token: Token }) => {
    const scanner: Scanner = new Scanner(source);
    scanner.scan();
    expect(scanner.rescan(MarkdownHtmlScanner.rescanHtmlAttributeName)).toBe(token);
});

it.each`
    source     | token                                   | tokenValue
    ${"a"}     | ${Token.HtmlUnquotedAttributeValue}     | ${"a"}
    ${"+"}     | ${Token.HtmlUnquotedAttributeValue}     | ${"+"}
    ${"\"a\""} | ${Token.HtmlDoubleQuotedAttributeValue} | ${"a"}
    ${"\"'\""} | ${Token.HtmlDoubleQuotedAttributeValue} | ${"'"}
    ${"\"=\""} | ${Token.HtmlDoubleQuotedAttributeValue} | ${"="}
    ${"\"<\""} | ${Token.HtmlDoubleQuotedAttributeValue} | ${"<"}
    ${"\">\""} | ${Token.HtmlDoubleQuotedAttributeValue} | ${">"}
    ${"\"`\""} | ${Token.HtmlDoubleQuotedAttributeValue} | ${"`"}
    ${"'a'"}   | ${Token.HtmlSingleQuotedAttributeValue} | ${"a"}
    ${"'\"'"}  | ${Token.HtmlSingleQuotedAttributeValue} | ${"\""}
    ${"'='"}   | ${Token.HtmlSingleQuotedAttributeValue} | ${"="}
    ${"'<'"}   | ${Token.HtmlSingleQuotedAttributeValue} | ${"<"}
    ${"'>'"}   | ${Token.HtmlSingleQuotedAttributeValue} | ${">"}
    ${"'\`'"}  | ${Token.HtmlSingleQuotedAttributeValue} | ${"`"}
    ${"\""}    | ${Token.QuoteMarkToken}                 | ${"\""}
    ${"'"}     | ${Token.ApostropheToken}                | ${"'"}
    ${"="}     | ${Token.EqualsToken}                    | ${"="}
    ${"<"}     | ${Token.LessThanToken}                  | ${"<"}
    ${">"}     | ${Token.GreaterThanToken}               | ${">"}
    ${"`"}     | ${Token.BacktickToken}                  | ${"`"}
`('rescanHtmlAttributeValue: "$source"', ({ source, token, tokenValue }: { source: string, token: Token, tokenValue: string }) => {
    const scanner: Scanner = new Scanner(source);
    scanner.scan();
    expect(scanner.rescan(MarkdownHtmlScanner.rescanHtmlAttributeValue, true)).toBe(token);
    expect(scanner.getTokenValue()).toBe(tokenValue)
});

