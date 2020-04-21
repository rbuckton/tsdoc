import { Token } from "../../Token";
import { Scanner } from "../../Scanner";
import { MarkdownHeadingScanner } from "../MarkdownHeadingScanner";

it.each`
    name                | source        | token                    | tokenText
    ${"#(space)"}       | ${"# "}       | ${Token.AtxHeadingToken} | ${"#"}
    ${"##(space)"}      | ${"## "}      | ${Token.AtxHeadingToken} | ${"##"}
    ${"###(space)"}     | ${"### "}     | ${Token.AtxHeadingToken} | ${"###"}
    ${"####(space)"}    | ${"#### "}    | ${Token.AtxHeadingToken} | ${"####"}
    ${"#####(space)"}   | ${"##### "}   | ${Token.AtxHeadingToken} | ${"#####"}
    ${"######(space)"}  | ${"###### "}  | ${Token.AtxHeadingToken} | ${"######"}
    ${"#######(space)"} | ${"####### "} | ${Token.HashToken}       | ${"#"}
    ${"#(tab)"}         | ${"#\t"}      | ${Token.AtxHeadingToken} | ${"#"}
    ${"#(lineFeed)"}    | ${"#\n"}      | ${Token.AtxHeadingToken} | ${"#"}
    ${"#a"}             | ${"#a"}       | ${Token.HashToken}       | ${"#"}
`('rescanAtxHeadingToken: $name', ({ source, token, tokenText }: { source: string, token: Token, tokenText: string }) => {
    const scanner: Scanner = new Scanner(source);
    scanner.scan();
    expect(scanner.rescan(MarkdownHeadingScanner.rescanAtxHeadingToken)).toBe(token);
    expect(scanner.getTokenText()).toBe(tokenText);
});

it.each`
    source      | token                             | tokenText
    ${"-"}      | ${Token.MinusSetextHeadingToken}  | ${"-"}
    ${"--"}     | ${Token.MinusSetextHeadingToken}  | ${"--"}
    ${"---"}    | ${Token.MinusSetextHeadingToken}  | ${"---"}
    ${"--- "}   | ${Token.MinusSetextHeadingToken}  | ${"---"}
    ${"="}      | ${Token.EqualsSetextHeadingToken} | ${"="}
    ${"=="}     | ${Token.EqualsSetextHeadingToken} | ${"=="}
    ${"==="}    | ${Token.EqualsSetextHeadingToken} | ${"==="}
    ${"=== "}   | ${Token.EqualsSetextHeadingToken} | ${"==="}
`('rescanSetextHeadingToken: "$source"', ({ source, token, tokenText }: { source: string, token: Token, tokenText: string }) => {
    const scanner: Scanner = new Scanner(source);
    scanner.scan();
    expect(scanner.rescan(MarkdownHeadingScanner.rescanSetextHeadingToken)).toBe(token);
    expect(scanner.getTokenText()).toBe(tokenText);
});

