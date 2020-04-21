import { Token } from "../../Token";
import { Scanner } from "../../Scanner";
import { MarkdownCodeBlockScanner } from "../MarkdownCodeBlockScanner";

it.each`
    source     | token                           | tokenText
    ${"``"}    | ${Token.BacktickToken}          | ${"`"}
    ${"```"}   | ${Token.BacktickCodeFenceToken} | ${"```"}
    ${"````"}  | ${Token.BacktickCodeFenceToken} | ${"````"}
    ${"~~"}    | ${Token.TildeToken}             | ${"~"}
    ${"~~~"}   | ${Token.TildeCodeFenceToken}    | ${"~~~"}
    ${"~~~~"}  | ${Token.TildeCodeFenceToken}    | ${"~~~~"}
`('rescanCodeFenceToken: "$source"', ({ source, token, tokenText }: { source: string, token: Token, tokenText: string }) => {
    const scanner: Scanner = new Scanner(source);
    scanner.scan();
    expect(scanner.rescan(MarkdownCodeBlockScanner.rescanCodeFenceToken)).toBe(token);
    expect(scanner.getTokenText()).toBe(tokenText);
});
