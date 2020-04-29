import { CharacterCodes } from "./CharacterCodes";
import { UnicodeUtils } from "./utils/UnicodeUtils";
import { ArrayUtils } from "./utils/ArrayUtils";
import { Mapper, IMapping } from "./Mapper";

export type PeekExpectation = ((codePoint: number | undefined) => boolean) | number | undefined;

function isExpected(codePoint: number | undefined, expectation: PeekExpectation): boolean {
    return typeof expectation === "function" ?
        expectation(codePoint) :
        expectation === codePoint;
}

export interface IPreprocessorState {
    readonly pos: number;
    readonly line: number;
    readonly column: number;
    readonly mapping: number;
}

/**
 * Preprocesses source text to convert UTF8 code units into Unicode code points, perform line-ending
 * normalization, and replace insecure characters.
 */
export class Preprocessor {
    private _text: string;
    private _pos: number = 0;
    private _line: number = 0;
    private _column: number = 0;
    private _lineStarts: number[] = [0];
    private _charactersRead: number = 0;
    private _lastState: IPreprocessorState | undefined;
    private _mapper: Mapper;
    private _mappingIndex: number = 0;

    public constructor(text: string, mappings?: ReadonlyArray<IMapping>) {
        this._mapper = new Mapper(mappings);
        this._text = text;
    }

    /**
     * Gets the underlying text.
     */
    public get text(): string {
        return this._text;
    }

    /**
     * Gets the current position within the text.
     */
    public get pos(): number {
        return this._mapper.toSourcePos(this._pos, this._mappingIndex);
    }

    /**
     * Gets the line number for the current position (zero-based).
     */
    public get line(): number {
        return this._line;
    }

    /**
     * Gets the column number for the current position, assuming a 4-column tab offset for tab characters (zero-based).
     */
    public get column(): number {
        return this._column;
    }

    public get mapper(): Mapper {
        return this._mapper;
    }

    /**
     * Determines whether the preprocessor's internal state is the same as the provided
     * state snapshot.
     */
    public hasState(state: IPreprocessorState): boolean {
        return this._pos === state.pos
            && this._line === state.line
            && this._column === state.column
            && this._mappingIndex === state.mapping;
    }

    /**
     * Gets a snapshot of the preprocessor's internal state.
     */
    public getState(): IPreprocessorState {
        if (!this._lastState) {
            this._lastState = {
                pos: this._pos,
                line: this._line,
                column: this._column,
                mapping: this._mappingIndex
            };
        }
        return this._lastState;
    }

    /**
     * Sets the preprocessor's internal state to be the same as the provided
     * state snapshot.
     */
    public setState(state: IPreprocessorState): void {
        if (!this.hasState(state)) {
            if (state.pos > this._charactersRead) {
                throw new Error("Cannot set state beyond read character count.");
            }
            this._pos = state.pos;
            this._line = state.line;
            this._column = state.column;
            this._mappingIndex = state.mapping;
            this._lastState = state;
        }
    }

    /**
     * Returns a section of a the underlying text.
     * NUL characters are replaced with 0xfffd (REPLACEMENT CHARACTER).
     * CARRIAGE RETURN and CARRIAGE RETURN + LINE FEED are replaced with a single LINE FEED.
     */
    public slice(start?: number, end?: number): string {
        if (start !== undefined && start >= 0) start = this._mapper.toPos(start, this._mappingIndex)
        if (end !== undefined && end >= 0) end = this._mapper.toPos(end, this._mappingIndex);
        return this._text.slice(start, end)
            .replace(/\0/g, "\ufffd")
            .replace(/\r\n?/g, "\n");
    }

    /**
     * Reads the next character.
     */
    public read(): number | undefined {
        this._lastState = undefined;

        // https://spec.commonmark.org/0.29/#character
        let codePoint: number | undefined = UnicodeUtils.codePointAt(this._text, this._pos);
        if (codePoint === undefined) {
            return undefined;
        }

        let size: number = UnicodeUtils.codePointSize(codePoint);

        // https://spec.commonmark.org/0.29/#insecure-characters
        if (codePoint === CharacterCodes.nul) {
            codePoint = CharacterCodes.replacementCharacter;
        }

        // https://spec.commonmark.org/0.29/#line-ending
        if (codePoint === CharacterCodes.lineFeed || codePoint === CharacterCodes.carriageReturn) {
            if (codePoint === CharacterCodes.carriageReturn && UnicodeUtils.codePointAt(this._text, this._pos + 1) === CharacterCodes.lineFeed) {
                size++;
            }
            codePoint = CharacterCodes.lineFeed;
        }

        this._pos += size;

        if (codePoint === CharacterCodes.lineFeed) {
            this._column = 0;
            this._line++;
            this._lineStarts[this._line] = this._pos;
        } else {
            // https://spec.commonmark.org/0.29/#tabs
            this._column += codePoint === CharacterCodes.tab ? 4 - (this._column % 4) : 1;
        }

        // mark furthest point read
        if (this._pos > this._charactersRead) {
            this._charactersRead = this._pos;
        }

        if (this._mapper.mappings) {
            while (this._mappingIndex < this._mapper.mappings.length - 1 &&
                this._pos >= this._mapper.mappings[this._mappingIndex + 1].pos) {
                this._mappingIndex++;
            }
        }

        return codePoint;
    }

    /**
     * Advance the specified number of characters.
     */
    public advance(count: number): number {
        let moved: number = 0;
        while (count > 0) {
            count--;
            const codePoint: number | undefined = this.read();
            if (codePoint === undefined) {
                break;
            }
            moved++;
        }
        return moved;
    }

    /**
     * Retreat the specified number of characters.
     */
    public retreat(count: number = 1): number {
        if (count < 0) {
            return 0;
        }

        const newPos: number = Math.max(0, this._pos - count);
        const moved: number = this._pos - newPos;
        this.setPos(newPos);
        return moved;
    }

    /**
     * Sets the position.
     */
    public setPos(newPos: number): void {
        if (newPos < 0) {
            throw new Error("Argument out of range: newPos");
        }

        newPos = this._mapper.toPos(newPos, this._mappingIndex);
        return this._setPos(newPos);
    }

    private _setPos(newPos: number) {
        if (newPos < 0) {
            throw new Error("Argument out of range: newPos");
        }

        if (newPos > this._charactersRead) {
            throw new Error("Argument out of range: newPos");
        }

        this._lastState = undefined;
        this._pos = newPos;

        const charCode: number = this._text.charCodeAt(this._pos);
        if (charCode === CharacterCodes.lineFeed && this._pos > 0) {
            // adjust position to the beginning of a `\r\n` line ending.
            const prevCharCode: number = this._text.charCodeAt(this._pos - 1);
            if (prevCharCode === CharacterCodes.carriageReturn) {
                this._pos--;
            }
        } else if (UnicodeUtils.isLowSurrogate(charCode) && this._pos > 0) {
            // adjust position to the beginning of a Unicode surrogate pair.
            const prevCharCode: number = this._text.charCodeAt(this._pos - 1);
            if (UnicodeUtils.isHighSurrogate(prevCharCode)) {
                this._pos--;
            }
        }

        // recompute line/column
        const recomputeLine: boolean =
            this._pos < this._lineStarts[this._line] ||
            this._pos >= (this._line + 1 < this._lineStarts.length ? this._lineStarts[this._line + 1] : this._text.length);
        if (recomputeLine) {
            this._line = ArrayUtils.greatestLowerBound(ArrayUtils.binarySearch(this._lineStarts, this._pos));
        }

        const recomputeColumn: boolean = recomputeLine || charCode === CharacterCodes.tab;
        if (recomputeColumn) {
            let i: number = this._lineStarts[this._line];
            let column: number = 0;
            while (i < this._pos) {
                const codePoint: number = UnicodeUtils.codePointAt(this._text, i) || 0;
                column += codePoint === CharacterCodes.tab ? 4 - (column % 4) : 1;
                i += UnicodeUtils.codePointSize(codePoint);
            }
            this._column = column;
        } else {
            this._column--;
        }

        if (this._mapper.mappings) {
            while (this._mappingIndex > 0 &&
                this._pos < this._mapper.mappings[this._mappingIndex].pos) {
                this._mappingIndex--;
            }

            while (this._mappingIndex < this._mapper.mappings.length - 1 &&
                this._pos >= this._mapper.mappings[this._mappingIndex + 1].pos) {
                this._mappingIndex++;
            }
        }
    }

    /**
     * Perform speculative lookahead or look-behind.
     * @param lookAround Indicates whether the position should be unconditionally reset when the callback completes.
     * @param cb The callback to execute. If the return value is `undefined`, then the position will be reset.
     * @param args Arguments to pass to the callback.
     */
    public speculate<A extends any[], T>(lookAround: boolean, cb: (...args: A) => T, ...args: A): T {
        const savedPos: number = this._pos;
        const savedLine: number = this._line;
        const savedColumn: number = this._column;
        const savedMappingIndex: number = this._mappingIndex;
        let result!: T;
        try {
            result = cb(...args);
        } finally {
            if (lookAround || result === undefined) {
                this._pos = savedPos;
                this._line = savedLine;
                this._column = savedColumn;
                this._mappingIndex = savedMappingIndex;
            }
        }
        return result;
    }

    /**
     * Peeks at an upcoming character.
     * @param lookAhead The number of characters to look ahead (or behind, for negative values) from the current position.
     */
    public peek(lookAhead: number = 0): number | undefined {
        if (lookAhead === 0) return UnicodeUtils.codePointAt(this._text, this._pos);
        return this.speculate(/*lookAround*/ true, Preprocessor._peek, this, lookAhead);
    }

    private static _peek(preprocessor: Preprocessor, count: number): number | undefined {
        if (count > 0) {
            const advanceCount: number = preprocessor.advance(count);
            if (advanceCount < count) {
                return undefined;
            }
        } else if (count < 0) {
            const retreatCount: number = preprocessor.retreat(-count);
            if (retreatCount < -count) {
                return undefined;
            }
        }
        return preprocessor.read();
    }

    /**
     * Peeks at an specific character.
     * @param pos Peeks at the character at the specified position
     */
    public peekAt(pos: number): number | undefined {
        if (pos < 0) return undefined;
        pos = this._mapper.toPos(pos, this._mappingIndex);
        return this.speculate(/*lookAround*/ true, Preprocessor._peekAt, this, pos);
    }

    private static _peekAt(preprocessor: Preprocessor, pos: number): number | undefined {
        if (pos < 0) {
            return undefined;
        }
        if (pos < preprocessor._charactersRead) {
            preprocessor._setPos(pos);
            return preprocessor.read();
        }
        let codePoint: number | undefined;
        while (preprocessor._pos <= pos) {
            codePoint = preprocessor.read();
            if (codePoint === undefined) {
                return undefined;
            }
        }
        return codePoint;
    }

    /**
     * Peeks at an upcoming character and determines whether it matches the provided expectation.
     * @param lookAhead The number of characters to look ahead from the current position.
     * @param expectation The expectation to test.
     */
    public peekIs(lookAhead: number, expectation: PeekExpectation): boolean {
        const codePoint: number | undefined = this.peek(lookAhead);
        return isExpected(codePoint, expectation);
    }

    /**
     * Peeks at an upcoming character and determines whether it matches any of the provided expectations.
     * @param lookAhead The number of characters to look ahead from the current position.
     * @param alernatives The expectations to test.
     */
    public peekIsAny(lookAhead: number, ...alternatives: [PeekExpectation, ...PeekExpectation[]]): boolean {
        const codePoint: number | undefined = this.peek(lookAhead);
        for (const alternative of alternatives) {
            if (isExpected(codePoint, alternative)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Peeks at upcoming characters and determines whether each matches the provided sequence of expectations.
     * @param lookAhead The number of characters to look ahead from the current position.
     * @param sequence The sequence of expectations to test.
     */
    public peekIsSequence(lookAhead: number, ...sequence: [PeekExpectation | string, ...(PeekExpectation | string)[]]): boolean {
        for (let i: number = 0; i < sequence.length; i++) {
            const expectation: PeekExpectation | string = sequence[i];
            if (typeof expectation === 'string') {
                let textPos: number = 0;
                while (textPos < expectation.length) {
                    const codePoint: number | undefined = UnicodeUtils.codePointAt(expectation, textPos);
                    if (codePoint === undefined || !this.peekIs(lookAhead, codePoint)) {
                        return false;
                    }
                    textPos += UnicodeUtils.codePointSize(codePoint);
                    lookAhead++;
                }
            } else if (!this.peekIs(lookAhead, expectation)) {
                return false;
            } else {
                lookAhead++;
            }
        }
        return true;
    }

    /**
     * Peeks at upcoming characters and determines how many characters match the provided expectation.
     * @param lookAhead The number of characters to look ahead from the current position.
     * @param expectation The expectation to test.
     */
    public peekCount(lookAhead: number, expectation: NonNullable<PeekExpectation>): number;
    /**
     * Peeks at upcoming characters and determines how many characters match the provided expectation.
     * This is useful for scanning things like identifiers.
     * @param lookAhead The number of characters to look ahead from the current position.
     * @param startExpectation The expectation to test for the first character.
     * @param restExpectation The expectation to test for the remaining characters.
     */
    public peekCount(lookAhead: number, startExpectation: NonNullable<PeekExpectation>, restExpectation: NonNullable<PeekExpectation>): number;
    public peekCount(lookAhead: number, expectation: NonNullable<PeekExpectation>, restExpectation?: NonNullable<PeekExpectation>): number {
        let count: number = 0;
        for (;;) {
            const codePoint: number | undefined = this.peek(lookAhead + count);
            if (codePoint === undefined) {
                break;
            }
            if (!isExpected(codePoint, expectation)) {
                break;
            }
            if (restExpectation) {
                expectation = restExpectation;
                restExpectation = undefined;
            }
            count++;
        }
        return count;
    }

    /**
     * Peeks at upcoming characters and determines how many characters match the provided expectation.
     * If fewer characters match than the provided minimum count, `undefined` is returned.
     * @param lookAhead The number of characters to look ahead from the current position.
     * @param expectation The expectation to test.
     */
    public peekMinCount(lookAhead: number, minCount: number, expectation: NonNullable<PeekExpectation>): number | undefined;
    /**
     * Peeks at upcoming characters and determines how many characters match the provided expectation.
     * If fewer characters match than the provided minimum count, `undefined` is returned.
     * @param lookAhead The number of characters to look ahead from the current position.
     * @param startExpectation The expectation to test for the first character.
     * @param restExpectation The expectation to test for the remaining characters.
     */
    public peekMinCount(lookAhead: number, minCount: number, startExpectation: NonNullable<PeekExpectation>, restExpectation: NonNullable<PeekExpectation>): number | undefined;
    public peekMinCount(lookAhead: number, minCount: number, expectation: NonNullable<PeekExpectation>, restExpectation?: NonNullable<PeekExpectation>): number | undefined {
        let count: number = 0;
        for (;;) {
            const codePoint: number | undefined = this.peek(lookAhead + count);
            if (codePoint === undefined) {
                break;
            }
            if (!isExpected(codePoint, expectation)) {
                break;
            }
            if (restExpectation) {
                expectation = restExpectation;
                restExpectation = undefined;
            }
            count++;
        }
        return count < minCount ? undefined : count;
    }

    /**
     * Peeks at upcoming characters and determines how many characters match the provided expectation.
     * If more characters match than the provided maximum count, `undefined` is returned.
     * @param lookAhead The number of characters to look ahead from the current position.
     * @param expectation The expectation to test.
     */
    public peekMaxCount(lookAhead: number, maxCount: number, expectation: NonNullable<PeekExpectation>): number | undefined;
    /**
     * Peeks at upcoming characters and determines how many characters match the provided expectation.
     * If more characters match than the provided maximum count, `undefined` is returned.
     * @param lookAhead The number of characters to look ahead from the current position.
     * @param startExpectation The expectation to test for the first character.
     * @param restExpectation The expectation to test for the remaining characters.
     */
    public peekMaxCount(lookAhead: number, maxCount: number, startExpectation: NonNullable<PeekExpectation>, restExpectation: NonNullable<PeekExpectation>): number | undefined;
    /**
     * Peeks at upcoming characters and determines how many characters match the provided expectation.
     * If more characters match than the provided maximum count, `undefined` is returned.
     * @param lookAhead The number of characters to look ahead from the current position.
     * @param startExpectation The expectation to test for the first character.
     * @param restExpectation The expectation to test for the remaining characters.
     * @param endExpectation The expectation to test for the last character.
     */
    public peekMaxCount(lookAhead: number, maxCount: number, startExpectation: NonNullable<PeekExpectation>, restExpectation: NonNullable<PeekExpectation>, endExpectation: NonNullable<PeekExpectation>): number | undefined;
    public peekMaxCount(lookAhead: number, maxCount: number, expectation: NonNullable<PeekExpectation>, restExpectation?: NonNullable<PeekExpectation>, endExpectation?: NonNullable<PeekExpectation>): number | undefined {
        let count: number = 0;
        let matchesEnd: boolean = !endExpectation;
        for (;;) {
            const codePoint: number | undefined = this.peek(lookAhead + count);
            if (codePoint === undefined) {
                break;
            }
            if (!isExpected(codePoint, expectation)) {
                if (endExpectation && isExpected(codePoint, endExpectation)) {
                    matchesEnd = true;
                    count++;
                }
                break;
            }
            matchesEnd = !endExpectation || isExpected(codePoint, endExpectation);
            if (count >= maxCount) {
                return undefined;
            }
            if (restExpectation) {
                expectation = restExpectation;
                restExpectation = undefined;
            }
            count++;
        }
        return matchesEnd ? count : count;
    }

    /**
     * Peeks at upcoming characters and determines how many characters do not match the provided expectation.
     * @param lookAhead The number of characters to look ahead from the current position.
     * @param stopExpectation The expectation to test.
     */
    public peekCountUntil(lookAhead: number, stopExpectation: NonNullable<PeekExpectation>): number {
        let count: number = 0;
        for (;;) {
            const codePoint: number | undefined = this.peek(lookAhead + count);
            if (codePoint === undefined) {
                break;
            }
            if (isExpected(codePoint, stopExpectation)) {
                break;
            }
            count++;
        }
        return count;
    }

    /**
     * Peeks at upcoming characters and determines how many characters do not match any of the provided expectations.
     * @param lookAhead The number of characters to look ahead from the current position.
     * @param stopExpectations The expectations to test.
     */
    public peekCountUntilAny(lookAhead: number, ...stopExpectations: NonNullable<PeekExpectation>[]): number {
        let count: number = 0;
        for (;;) {
            const codePoint: number | undefined = this.peek(lookAhead + count);
            if (codePoint === undefined) {
                return count;
            }
            for (const stopExpectation of stopExpectations) {
                if (isExpected(codePoint, stopExpectation)) {
                    return count;
                }
            }
            count++;
        }
    }

}
