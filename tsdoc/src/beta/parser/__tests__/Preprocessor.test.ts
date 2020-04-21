import { Preprocessor } from "../Preprocessor";
import { CharacterCodes } from "../CharacterCodes";

describe('read', () => {
    test('empty', () => {
        const preprocessor: Preprocessor = new Preprocessor("");
        expect(preprocessor.read()).toBe(undefined);
    });
    test('lines and columns', () => {
        const preprocessor: Preprocessor = new Preprocessor("a\nb");
        expect(preprocessor.line).toBe(0);
        expect(preprocessor.column).toBe(0);

        expect(preprocessor.read()).toBe(CharacterCodes.a);
        expect(preprocessor.line).toBe(0);
        expect(preprocessor.column).toBe(1);

        expect(preprocessor.read()).toBe(CharacterCodes.lineFeed);
        expect(preprocessor.line).toBe(1);
        expect(preprocessor.column).toBe(0);

        expect(preprocessor.read()).toBe(CharacterCodes.b);
        expect(preprocessor.line).toBe(1);
        expect(preprocessor.column).toBe(1);

        expect(preprocessor.read()).toBe(undefined);
        expect(preprocessor.line).toBe(1);
        expect(preprocessor.column).toBe(1);
    });
    test('line terminator normalization (\\r\\n)', () => {
        const preprocessor: Preprocessor = new Preprocessor("\r\n");
        expect(preprocessor.read()).toBe(CharacterCodes.lineFeed);
        expect(preprocessor.pos).toBe(2);
        expect(preprocessor.line).toBe(1);
        expect(preprocessor.column).toBe(0);
        expect(preprocessor.read()).toBe(undefined);
    });
    test('line terminator normalization (\\r)', () => {
        const preprocessor: Preprocessor = new Preprocessor("\r");
        expect(preprocessor.read()).toBe(CharacterCodes.lineFeed);
        expect(preprocessor.pos).toBe(1);
        expect(preprocessor.line).toBe(1);
        expect(preprocessor.column).toBe(0);
        expect(preprocessor.read()).toBe(undefined);
    });
    test('nul normalization', () => {
        const preprocessor: Preprocessor = new Preprocessor("\0");
        expect(preprocessor.read()).toBe(CharacterCodes.replacementCharacter);
    });
    test('tab columns (aligned)', () => {
        const preprocessor: Preprocessor = new Preprocessor("\t");
        expect(preprocessor.read()).toBe(CharacterCodes.tab);
        expect(preprocessor.pos).toBe(1);
        expect(preprocessor.column).toBe(4);
    });
    test('tab columns (unaligned)', () => {
        const preprocessor: Preprocessor = new Preprocessor("  \t");
        preprocessor.read();
        preprocessor.read();
        expect(preprocessor.read()).toBe(CharacterCodes.tab);
        expect(preprocessor.pos).toBe(3);
        expect(preprocessor.column).toBe(4);
    });
    test('surrogate pairs', () => {
        const preprocessor: Preprocessor = new Preprocessor("\u{1f602}");
        expect(preprocessor.read()).toBe(0x1f602);
        expect(preprocessor.pos).toBe(2);
    });
});

describe('retreat', () => {
    test('ascii', () => {
        const preprocessor: Preprocessor = new Preprocessor("ab");
        preprocessor.read();
        preprocessor.retreat();
        expect(preprocessor.pos).toBe(0);
        expect(preprocessor.line).toBe(0);
        expect(preprocessor.column).toBe(0);
    });
    test('line break (\\n)', () => {
        const preprocessor: Preprocessor = new Preprocessor("a\nb");
        preprocessor.read();
        preprocessor.read();
        preprocessor.retreat();
        expect(preprocessor.pos).toBe(1);
        expect(preprocessor.line).toBe(0);
        expect(preprocessor.column).toBe(1);
    });
    test('line break (\\r\\n)', () => {
        const preprocessor: Preprocessor = new Preprocessor("a\r\nb");
        preprocessor.read();
        preprocessor.read();
        preprocessor.retreat();
        expect(preprocessor.pos).toBe(1);
        expect(preprocessor.line).toBe(0);
        expect(preprocessor.column).toBe(1);
    });
    test('tabs', () => {
        const preprocessor: Preprocessor = new Preprocessor("a\tb");
        preprocessor.read();
        preprocessor.read();
        preprocessor.retreat();
        expect(preprocessor.pos).toBe(1);
        expect(preprocessor.line).toBe(0);
        expect(preprocessor.column).toBe(1);
    });
    test('surrogate pairs', () => {
        const preprocessor: Preprocessor = new Preprocessor("a\u{1f602}b");
        preprocessor.read();
        preprocessor.read();
        preprocessor.retreat();
        expect(preprocessor.pos).toBe(1);
        expect(preprocessor.line).toBe(0);
        expect(preprocessor.column).toBe(1);
    });
});

it('peek', () => {
    const preprocessor: Preprocessor = new Preprocessor("abc");
    preprocessor.read();
    const pos: number = preprocessor.pos;
    const line: number = preprocessor.line;
    const column: number = preprocessor.column;
    expect(preprocessor.peek(0)).toBe(CharacterCodes.b);
    expect(preprocessor.peek(1)).toBe(CharacterCodes.c);
    expect(preprocessor.peek(2)).toBe(undefined);
    expect(preprocessor.pos).toBe(pos);
    expect(preprocessor.line).toBe(line);
    expect(preprocessor.column).toBe(column);
});

describe('peekIs', () => {
    it('with character code', () => {
        const preprocessor: Preprocessor = new Preprocessor("abc");
        preprocessor.read();
        expect(preprocessor.peekIs(0, CharacterCodes.b)).toBe(true);
        expect(preprocessor.peekIs(0, CharacterCodes.z)).toBe(false);
    });
    it('with callback', () => {
        const preprocessor: Preprocessor = new Preprocessor("abc");
        preprocessor.read();
        expect(preprocessor.peekIs(0, ch => ch === CharacterCodes.b)).toBe(true);
        expect(preprocessor.peekIs(0, ch => ch === CharacterCodes.z)).toBe(false);
    });
    it('with undefined', () => {
        const preprocessor: Preprocessor = new Preprocessor("abc");
        preprocessor.read();
        expect(preprocessor.peekIs(0, undefined)).toBe(false);
        expect(preprocessor.peekIs(2, undefined)).toBe(true);
    });
});

describe('peekIsAny', () => {
    it('with character codes', () => {
        const preprocessor: Preprocessor = new Preprocessor("abc");
        preprocessor.read();
        expect(preprocessor.peekIsAny(0, CharacterCodes.b, CharacterCodes.d)).toBe(true);
        expect(preprocessor.peekIsAny(0, CharacterCodes.z, CharacterCodes.y)).toBe(false);
    });
    it('with callbacks', () => {
        const preprocessor: Preprocessor = new Preprocessor("abc");
        preprocessor.read();
        expect(preprocessor.peekIsAny(0, ch => ch === CharacterCodes.b, ch => ch === CharacterCodes.d)).toBe(true);
        expect(preprocessor.peekIsAny(0, ch => ch === CharacterCodes.z, ch => ch === CharacterCodes.y)).toBe(false);
    });
    it('with undefined', () => {
        const preprocessor: Preprocessor = new Preprocessor("abc");
        preprocessor.read();
        expect(preprocessor.peekIsAny(0, undefined)).toBe(false);
        expect(preprocessor.peekIsAny(2, undefined)).toBe(true);
    });
    it('with mixed', () => {
        const preprocessor: Preprocessor = new Preprocessor("abc");
        preprocessor.read();
        expect(preprocessor.peekIsAny(0, CharacterCodes.b, ch => ch === CharacterCodes.d)).toBe(true);
        expect(preprocessor.peekIsAny(0, CharacterCodes.z, ch => ch === CharacterCodes.y)).toBe(false);
    });
});

describe('peekIsSequence', () => {
    it('with character codes', () => {
        const preprocessor: Preprocessor = new Preprocessor("abc");
        preprocessor.read();
        expect(preprocessor.peekIsSequence(0, CharacterCodes.b, CharacterCodes.c)).toBe(true);
        expect(preprocessor.peekIsSequence(0, CharacterCodes.b, CharacterCodes.d)).toBe(false);
    });
    it('with callbacks', () => {
        const preprocessor: Preprocessor = new Preprocessor("abc");
        preprocessor.read();
        expect(preprocessor.peekIsSequence(0, ch => ch === CharacterCodes.b, ch => ch === CharacterCodes.c)).toBe(true);
        expect(preprocessor.peekIsSequence(0, ch => ch === CharacterCodes.b, ch => ch === CharacterCodes.d)).toBe(false);
    });
    it('with undefined', () => {
        const preprocessor: Preprocessor = new Preprocessor("abc");
        preprocessor.read();
        expect(preprocessor.peekIsSequence(0, undefined)).toBe(false);
        expect(preprocessor.peekIsSequence(2, undefined)).toBe(true);
    });
    it('with mixed', () => {
        const preprocessor: Preprocessor = new Preprocessor("abc");
        preprocessor.read();
        expect(preprocessor.peekIsSequence(0, CharacterCodes.b, ch => ch === CharacterCodes.c, undefined)).toBe(true);
        expect(preprocessor.peekIsSequence(0, CharacterCodes.b, ch => ch === CharacterCodes.d, undefined)).toBe(false);
    });
});

describe('peekCount', () => {
    it("with single expectation", () => {
        const preprocessor: Preprocessor = new Preprocessor("abbbbbc");
        preprocessor.read();
        expect(preprocessor.peekCount(0, CharacterCodes.b)).toBe(5);
    });
    it("with start and rest expectation", () => {
        const preprocessor: Preprocessor = new Preprocessor("abccccd");
        preprocessor.read();
        expect(preprocessor.peekCount(0, CharacterCodes.b, CharacterCodes.c)).toBe(5);
    });
});

it('peekMaxCount', () => {
    const preprocessor: Preprocessor = new Preprocessor("abbbbb");
    preprocessor.read();
    expect(preprocessor.peekMaxCount(0, 5, CharacterCodes.b)).toBe(5);
    expect(preprocessor.peekMaxCount(0, 6, CharacterCodes.b)).toBe(5);
    expect(preprocessor.peekMaxCount(0, 3, CharacterCodes.b)).toBe(undefined);
});

it('peekCountUntil', () => {
    const preprocessor: Preprocessor = new Preprocessor("abbbbbc");
    preprocessor.read();
    expect(preprocessor.peekCountUntil(0, CharacterCodes.b)).toBe(0);
    expect(preprocessor.peekCountUntil(0, CharacterCodes.c)).toBe(5);
});

it('slice', () => {
    const preprocessor: Preprocessor = new Preprocessor("a\0c\r\nc");
    expect(preprocessor.slice(1, -1)).toBe("\ufffdc\n");
});

describe('source segments', () => {
    it('read', () => {
        const preprocessor: Preprocessor = new Preprocessor("0123456789", [
            { pos: 0, sourcePos: 0 },
            { pos: 1, sourcePos: 10 },
            { pos: 6, sourcePos: 50 }
        ]);
        expect(preprocessor.pos).toBe(0); // pos: 0, sourcePos: 0
        preprocessor.read();
        expect(preprocessor.pos).toBe(10); // pos: 1, sourcePos: 10
        preprocessor.read();
        expect(preprocessor.pos).toBe(11); // pos: 2, sourcePos: 11
        preprocessor.advance(4);
        expect(preprocessor.pos).toBe(50); // pos: 6, sourcePos: 50
    });
    it('setPos', () => {
        const preprocessor: Preprocessor = new Preprocessor("0123456789", [
            { pos: 0, sourcePos: 0 },
            { pos: 1, sourcePos: 10 },
            { pos: 6, sourcePos: 50 }
        ]);
        preprocessor.advance(7);
        expect(preprocessor.pos).toBe(51);
        preprocessor.setPos(2);
        expect(preprocessor.pos).toBe(11);
        preprocessor.setPos(0);
        expect(preprocessor.pos).toBe(0);
        preprocessor.setPos(7);
        expect(preprocessor.pos).toBe(51);
    });
});