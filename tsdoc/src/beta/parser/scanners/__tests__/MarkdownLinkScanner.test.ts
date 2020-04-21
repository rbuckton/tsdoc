import { Scanner } from "../../Scanner";
import { MarkdownLinkScanner } from "../MarkdownLinkScanner";
import { Token } from "../../Token";

it.each`
    source      | token                     | tokenValue
    ${"[a]"}    | ${Token.LinkLabelToken}   | ${"a"}
    ${"[\\a]"}  | ${Token.LinkLabelToken}   | ${"\\a"}
    ${"[\\[a]"} | ${Token.LinkLabelToken}   | ${"\\[a"}
    ${"[ ]"}    | ${Token.LinkLabelToken}   | ${" "}
    ${"[]"}     | ${Token.LinkLabelToken}   | ${""}
`('link label "$source"', ({ source, token, tokenValue }: { source: string, token: Token, tokenValue: string }) => {
    const scanner: Scanner = new Scanner(source);
    scanner.scan();
    expect(scanner.rescan(MarkdownLinkScanner.rescanLinkLabel)).toBe(token);
    expect(scanner.getTokenValue()).toBe(tokenValue);
});

it.each`
    source      | token                         | tokenValue
    ${"<a>"}    | ${Token.LinkDestinationToken} | ${"a"}
    ${"<>"}     | ${Token.LinkDestinationToken} | ${""}
    ${"<\\a>"}  | ${Token.LinkDestinationToken} | ${"\\a"}
    ${"<\\<>"}  | ${Token.LinkDestinationToken} | ${"<"}
    ${"<"}      | ${Token.LessThanToken}        | ${"<"}
    ${"a"}      | ${Token.LinkDestinationToken} | ${"a"}
    ${"()"}     | ${Token.LinkDestinationToken} | ${"()"}
    ${"("}      | ${Token.OpenParenToken}       | ${"("}
`('link destination "$source"', ({ source, token, tokenValue }: { source: string, token: Token, tokenValue: string }) => {
    const scanner: Scanner = new Scanner(source);
    scanner.scan();
    expect(scanner.rescan(MarkdownLinkScanner.rescanLinkDestination)).toBe(token);
    expect(scanner.getTokenValue()).toBe(tokenValue);
});

it.each`
    source      | token                   | tokenValue
    ${"\"a\""}  | ${Token.LinkTitleToken} | ${"a"}
    ${"'a'"}    | ${Token.LinkTitleToken} | ${"a"}
    ${"(a)"}    | ${Token.LinkTitleToken} | ${"a"}
`('link title "$source"', ({ source, token, tokenValue }: { source: string, token: Token, tokenValue: string }) => {
    const scanner: Scanner = new Scanner(source);
    scanner.scan();
    expect(scanner.rescan(MarkdownLinkScanner.rescanLinkTitle)).toBe(token);
    expect(scanner.getTokenValue()).toBe(tokenValue);
});