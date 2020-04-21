import { Scanner } from "../../Scanner";
import { Token } from "../../Token";
import { TsDocBlockTagScanner } from "../TsDocBlockTagScanner";

it.each`
    tagName
    ${"@a"}
    ${"@ab"}
    ${"@a_"}
    ${"@a9"}
    ${"@a_9"}
`("rescanDocTagName: $a", ({ tagName }: { tagName: string }) => {
    const scanner: Scanner = new Scanner(tagName);
    scanner.scan();
    expect(scanner.rescan(TsDocBlockTagScanner.rescanTsDocTagName)).toBe(Token.DocTagName);
    expect(scanner.getTokenText()).toBe(tagName);
});

