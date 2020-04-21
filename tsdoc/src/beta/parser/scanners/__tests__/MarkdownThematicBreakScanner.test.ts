import { Token } from "../../Token";
import { Scanner } from "../../Scanner";
import { MarkdownThematicBreakScanner } from "../MarkdownThematicBreakScanner";

it.each`
    source      | token                                 | tokenText
    ${"**"}     | ${Token.AsteriskToken}                | ${"*"}
    ${"***"}    | ${Token.AsteriskThematicBreakToken}   | ${"***"}
    ${"****"}   | ${Token.AsteriskThematicBreakToken}   | ${"****"}
    ${"*** "}   | ${Token.AsteriskThematicBreakToken}   | ${"*** "}
    ${"* * * "} | ${Token.AsteriskThematicBreakToken}   | ${"* * * "}
    ${"--"}     | ${Token.MinusToken}                   | ${"-"}
    ${"---"}    | ${Token.MinusThematicBreakToken}      | ${"---"}
    ${"----"}   | ${Token.MinusThematicBreakToken}      | ${"----"}
    ${"--- "}   | ${Token.MinusThematicBreakToken}      | ${"--- "}
    ${"- - - "} | ${Token.MinusThematicBreakToken}      | ${"- - - "}
    ${"__"}     | ${Token.UnderscoreToken}              | ${"_"}
    ${"___"}    | ${Token.UnderscoreThematicBreakToken} | ${"___"}
    ${"____"}   | ${Token.UnderscoreThematicBreakToken} | ${"____"}
    ${"___ "}   | ${Token.UnderscoreThematicBreakToken} | ${"___ "}
    ${"_ _ _ "} | ${Token.UnderscoreThematicBreakToken} | ${"_ _ _ "}
`('rescanThematicBreakToken: "$source"', ({ source, token, tokenText }: { source: string, token: Token, tokenText: string }) => {
    const scanner: Scanner = new Scanner(source);
    scanner.scan();
    expect(scanner.rescan(MarkdownThematicBreakScanner.rescanThematicBreakToken)).toBe(token);
    expect(scanner.getTokenText()).toBe(tokenText);
});

