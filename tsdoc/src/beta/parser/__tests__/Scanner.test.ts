import { Scanner } from "../Scanner"
import { Token } from "../Token";

it("empty", () => {
    const scanner: Scanner = new Scanner("");
    expect(scanner.scan()).toBe(Token.EndOfFileToken);
});

it("paragraph", () => {
    const scanner: Scanner = new Scanner("a\nb");
    expect(scanner.startPos).toBe(0);
    expect(scanner.pos).toBe(0);
    expect(scanner.column).toBe(0);

    expect(scanner.scan()).toBe(Token.Text);
    expect(scanner.startPos).toBe(0);
    expect(scanner.pos).toBe(1);
    expect(scanner.column).toBe(1);

    expect(scanner.scan()).toBe(Token.NewLineTrivia);
    expect(scanner.startPos).toBe(1);
    expect(scanner.pos).toBe(2);
    expect(scanner.column).toBe(0);

    expect(scanner.scan()).toBe(Token.Text);
    expect(scanner.startPos).toBe(2);
    expect(scanner.pos).toBe(3);
    expect(scanner.column).toBe(1);

    expect(scanner.scan()).toBe(Token.EndOfFileToken);
    expect(scanner.startPos).toBe(3);
    expect(scanner.pos).toBe(3);
    expect(scanner.column).toBe(1);
});

it('rescanPartialTabTrivia', () => {
    const scanner: Scanner = new Scanner(" \t");
    scanner.scan();
    expect(scanner.scan(/*columns*/ true)).toBe(Token.PartialTabTrivia);
    expect(scanner.column).toBe(2);
    expect(scanner.scan(/*columns*/ true)).toBe(Token.PartialTabTrivia);
    expect(scanner.column).toBe(3);
    expect(scanner.scan(/*columns*/ true)).toBe(Token.PartialTabTrivia);
    expect(scanner.column).toBe(4);
});
