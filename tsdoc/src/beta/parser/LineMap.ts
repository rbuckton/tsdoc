import { UnicodeUtils } from "./utils/UnicodeUtils";
import { CharacterCodes } from "./CharacterCodes";
import { ArrayUtils } from "./utils/ArrayUtils";

export class Position {
    readonly line: number;
    readonly character: number;

    public constructor(line: number, character: number) {
        this.line = line;
        this.character = character;
    }

    public static compare(x: Position | undefined, y: Position | undefined): number {
        if (!x) return !y ? 0 : -1;
        if (!y) return 1;
        return x.line - y.line
            || x.character - y.character;
    }

    public compareTo(other: Position | undefined): number {
        return Position.compare(this, other);
    }
}

export class LineMap {
    private _text: string;
    private _lineStarts?: ReadonlyArray<number>;

    constructor(text: string) {
        this._text = text;
    }

    public get lineCount(): number {
        return this._computeLineStarts().length;
    }

    /**
     * Gets the offset at which a line starts.
     * @param line The zero-based line number. Line numbers are clamped such that `0 <= line < lineCount`.
     */
    public lineStart(line: number): number {
        const lineStarts: ReadonlyArray<number> = this._computeLineStarts();
        line = this._clampLine(lineStarts, line);
        return this._lineStart(lineStarts, line);
    }

    private _lineStart(lineStarts: ReadonlyArray<number>, line: number): number {
        return lineStarts[line];
    }

    /**
     * Gets the offset at which a line ends.
     * @param line The zero-based line number. Line numbers are clamped such that `0 <= line < lineCount`.
     * @param includeLineTerminator Whether to include the position of the line terminator (default `true`).
     */
    public lineEnd(line: number, includeLineTerminator: boolean = true): number {
        const lineStarts: ReadonlyArray<number> = this._computeLineStarts();
        line = this._clampLine(lineStarts, line);
        return this._lineEnd(lineStarts, line, includeLineTerminator);
    }

    private _lineEnd(lineStarts: ReadonlyArray<number>, line: number, includeLineTerminator: boolean): number {
        let lineEnd: number = line + 1 < lineStarts.length ? lineStarts[line + 1] : this._text.length;
        if (!includeLineTerminator) {
            const lineStart: number = this._lineStart(lineStarts, line);
            if (lineEnd > lineStart) {
                const charCode: number = this._text.charCodeAt(lineEnd - 1);
                switch (charCode) {
                    case CharacterCodes.lineFeed:
                        if (lineEnd - 1 > lineStart && this._text.charCodeAt(lineEnd - 2) === CharacterCodes.carriageReturn) {
                            lineEnd--;
                        }
                        // falls through
                    case CharacterCodes.carriageReturn:
                    case CharacterCodes.lineSeparator:
                    case CharacterCodes.paragraphSeparator:
                    case CharacterCodes.nextLine:
                        lineEnd--;
                        break;
                }
            }
        }
        return lineEnd;
    }

    /**
     * Gets the length of a line.
     * @param line The zero-based line number. Line numbers are clamped such that `0 <= line < lineCount`.
     * @param includeLineTerminator Whether to include the line terminator (default `true`).
     */
    public lineLength(line: number, includeLineTerminator: boolean = true): number {
        const lineStarts: ReadonlyArray<number> = this._computeLineStarts();
        line = this._clampLine(lineStarts, line);
        return this._lineEnd(lineStarts, line, includeLineTerminator) - this._lineStart(lineStarts, line);
    }

    /**
     * Gets the line number for the specified offset.
     * @param offset The offset into the source text. Offsets are clamped such that `0 <= offset <= text.length`.
     */
    public lineAt(offset: number): number {
        const lineStarts: ReadonlyArray<number> = this._computeLineStarts();
        offset = this._clampOffset(offset);
        return this._lineAt(lineStarts, offset);
    }

    private _lineAt(lineStarts: ReadonlyArray<number>, offset: number): number {
        return ArrayUtils.greatestLowerBound(ArrayUtils.binarySearch(lineStarts, offset));
    }

    /**
     * Gets the character count from the start of the line for the specified offset.
     * @param offset The offset into the source text. Offsets are clamped such that `0 <= offset <= text.length`.
     */
    public characterAt(offset: number): number {
        const lineStarts: ReadonlyArray<number> = this._computeLineStarts();
        offset = this._clampOffset(offset);
        const line: number = this._lineAt(lineStarts, offset);
        return this._characterAt(lineStarts, offset, line);
    }

    private _characterAt(lineStarts: ReadonlyArray<number>, offset: number, line: number): number {
        return offset - lineStarts[line];
    }

    /**
     * Gets an `IPosition` related to the specified offset. The `line` and `character` of the result are zero-based.
     * @param offset The offset into the source text. Offsets are clamped such that `0 <= offset <= text.length`.
     */
    public positionAt(offset: number): Position {
        const lineStarts: ReadonlyArray<number> = this._computeLineStarts();
        offset = this._clampOffset(offset);
        const line: number = this._lineAt(lineStarts, offset);
        const character: number = this._characterAt(lineStarts, offset, line);
        return new Position(line, character);
    }

    /**
     * Gets the offset within the source text for the specified `IPosition`.
     * @param position The position within the source text. Lines are clamped such that `0 <= position.line < lineCount`.
     *
     * Characters for all but the last line are clamped such that `0 <= position.character < lineLength(position.line)`.
     *
     * Characters for the last line are clamped such that `0 <= position.character <= lineLength(position.line)` to allow
     * for a position that represents the end of the source text.
     */
    public offsetAt(position: Position): number {
        const lineStarts: ReadonlyArray<number> = this._computeLineStarts();
        const line: number = this._clampLine(lineStarts, position.line);
        const lineStart: number = this._lineStart(lineStarts, line);
        const lineEnd: number = this._lineEnd(lineStarts, line, /*includeLineTerminator*/ true);
        const lineLength: number = lineEnd - lineStart;
        // allow a single character beyond text length to support a position that represents the end of the text.
        const maxCharacter: number = line === lineStarts.length - 1 ? lineLength + 1 : lineLength;
        const character: number = this._clamp(position.character, 0, maxCharacter);
        const offset: number = lineStart + character;
        return offset;
    }

    public static computeLineStarts(text: string): ReadonlyArray<number> {
        const lineStarts: number[] = [];
        let lineStart: number = 0;
        let pos: number = 0;
        while (pos < text.length) {
            const codePoint: number | undefined = UnicodeUtils.codePointAt(text, pos);
            if (codePoint === undefined) {
                break;
            }
            pos += UnicodeUtils.codePointSize(codePoint);
            switch (codePoint) {
                case CharacterCodes.carriageReturn:
                    if (UnicodeUtils.codePointAt(text, pos) === CharacterCodes.lineFeed) {
                        pos += UnicodeUtils.codePointSize(CharacterCodes.lineFeed);
                    }
                    // falls through
                case CharacterCodes.lineFeed:
                case CharacterCodes.lineSeparator:
                case CharacterCodes.paragraphSeparator:
                    lineStarts.push(lineStart);
                    lineStart = pos;
                    break;
            }
        }
        lineStarts.push(lineStart);
        return lineStarts;
    }

    private _computeLineStarts(): ReadonlyArray<number> {
        if (!this._lineStarts) {
            this._lineStarts = LineMap.computeLineStarts(this._text);
        }
        return this._lineStarts;
    }

    private _clamp(value: number, min: number, max: number): number {
        return value < min ? min : value > max ? max : value;
    }

    private _clampLine(lineStarts: ReadonlyArray<number>, line: number): number {
        return this._clamp(line, 0, lineStarts.length - 1);
    }

    private _clampOffset(offset: number): number {
        return this._clamp(offset, 0, this._text.length);
    }
}
