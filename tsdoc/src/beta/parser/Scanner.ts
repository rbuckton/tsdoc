import { Preprocessor, IPreprocessorState, IMapping } from "./Preprocessor";
import { Token } from "./Token";
import { CharacterCodes } from "./CharacterCodes";
import { UnicodeUtils } from "./utils/UnicodeUtils";
import { LineMap, Position } from "./LineMap";
import { StringUtils } from "./utils/StringUtils";

export interface IScannerState extends IPreprocessorState {
    readonly startPos: number;
    readonly startColumn: number;
    readonly token: Token;
    readonly tokenValue: string | undefined;
    readonly partialTabColumns: number;
}

export interface IRescanStringOptions {
    token: Token;
    openQuote?: number;
    closeQuote?: number;
    openBracket?: number;
    closeBracket?: number;
    stop?: (codePoint: number | undefined) => boolean;
    balanced?: boolean;
    maxSize?: number;
    nonEmpty?: boolean;
    nonWhitespace?: boolean;
    includeQuotes?: boolean;
    noBlankLines?: boolean;
}

export class Scanner {
    private _preprocessor: Preprocessor;
    private _startPos: number = 0;
    private _startColumn: number = 0;
    private _token: Token = Token.Unknown;
    private _tokenValue: string | undefined;
    private _partialTabColumns: number = 0;
    private _lastState: IScannerState | undefined;

    public constructor(text: string, sourceSegments?: ReadonlyArray<IMapping>) {
        this._preprocessor = new Preprocessor(text, sourceSegments);
    }

    /**
     * Gets the underlying preprocessor used by this scanner.
     */
    public get preprocessor(): Preprocessor {
        return this._preprocessor;
    }

    /**
     * Gets the underlying text.
     */
    public get text(): string {
        return this._preprocessor.text;
    }

    /**
     * Gets the current position within the text.
     */
    public get pos(): number {
        return this._preprocessor.pos;
    }

    /**
     * Gets the line number for the current position (zero-based).
     */
    public get line(): number {
        return this._preprocessor.line;
    }

    /**
     * Gets the column number for the current position, assuming a 4-column tab offset for tab characters (zero-based).
     */
    public get column(): number {
        return this._preprocessor.column - this._partialTabColumns;
    }

    /**
     * Gets the starting position of the last read token.
     */
    public get startPos(): number {
        return this._startPos;
    }

    /**
     * Gets the starting column number for the last read token, assuming a 4-column tab offset for tab characters (zero-based).
     */
    public get startColumn(): number {
        return this._startColumn;
    }

    /**
     * Gets the length of the last read token.
     */
    public get tokenLength(): number {
        return this.pos - this._startPos;
    }

    /**
     * Determines whether the scanner's internal state is the same as the provided
     * state snapshot.
     */
    public hasState(state: IScannerState): boolean {
        return this._preprocessor.hasState(state)
            && this._startPos === state.startPos
            && this._startColumn === state.startColumn
            && this._token === state.token
            && this._tokenValue === state.tokenValue
            && this._partialTabColumns === state.partialTabColumns;
    }

    /**
     * Gets a snapshot of the scanner's internal state.
     */
    public getState(): IScannerState {
        if (!this._lastState) {
            this._lastState = {
                ...this._preprocessor.getState(),
                startPos: this._startPos,
                startColumn: this._startColumn,
                token: this._token,
                tokenValue: this._tokenValue,
                partialTabColumns: this._partialTabColumns
            };
        }
        return this._lastState;
    }

    /**
     * Sets the scanner's internal state to be the same as the provided
     * state snapshot.
     */
    public setState(state: IScannerState | undefined): void {
        if (state && !this.hasState(state)) {
            this._startPos = state.startPos;
            this._startColumn = state.startColumn;
            this._token = state.token;
            this._tokenValue = state.tokenValue;
            this._partialTabColumns = state.partialTabColumns;
            this._preprocessor.setState(state);
            this._lastState = state;
        }
    }

    /**
     * Returns a section of a the underlying text.
     * NUL characters are replaced with 0xfffd (REPLACEMENT CHARACTER).
     * CARRIAGE RETURN and CARRIAGE RETURN + LINE FEED are replaced with a single LINE FEED.
     */
    public slice(start?: number, end?: number): string {
        return this._preprocessor.slice(start, end);
    }

    /**
     * Scans the next token using the default rules.
     * @param columns Indicates whether TAB characters should be advanced by a single column rather than the entire character.
     */
    public scan(columns: boolean = false): Token {
        this._lastState = undefined;
        if (columns) {
            this._rescanPartialTabTrivia();
        }
        if (this._partialTabColumns) {
            if (columns) {
                this._startColumn = this.column;
                this._partialTabColumns--;
                return this.setToken(Token.PartialTabTrivia);
            }
            this._partialTabColumns = 0;
        }

        this._startPos = this.pos;
        this._startColumn = this.column;
        const codePoint: number | undefined = this._preprocessor.read();
        if (codePoint === undefined) {
            return this.setToken(Token.EndOfFileToken);
        }

        switch (codePoint) {
            case CharacterCodes.lineFeed: return this.setToken(Token.NewLineTrivia);
            case CharacterCodes.space: return this.setToken(Token.SpaceTrivia);
            case CharacterCodes.tab:
                this.setToken(Token.TabTrivia);
                return columns ? this._rescanPartialTabTrivia() : this._token;
            case CharacterCodes.exclamation: return this.setToken(Token.ExclamationToken);
            case CharacterCodes.quoteMark: return this.setToken(Token.QuoteMarkToken);
            case CharacterCodes.hash: return this.setToken(Token.HashToken);
            case CharacterCodes.$: return this.setToken(Token.DollarToken);
            case CharacterCodes.percent: return this.setToken(Token.PercentToken);
            case CharacterCodes.ampersand: return this.setToken(Token.AmpersandToken);
            case CharacterCodes.apostrophe: return this.setToken(Token.ApostropheToken);
            case CharacterCodes.openParen: return this.setToken(Token.OpenParenToken);
            case CharacterCodes.closeParen: return this.setToken(Token.CloseParenToken);
            case CharacterCodes.asterisk: return this.setToken(Token.AsteriskToken);
            case CharacterCodes.plus: return this.setToken(Token.PlusToken);
            case CharacterCodes.comma: return this.setToken(Token.CommaToken);
            case CharacterCodes.minus: return this.setToken(Token.MinusToken);
            case CharacterCodes.dot: return this.setToken(Token.DotToken);
            case CharacterCodes.slash: return this.setToken(Token.SlashToken);
            case CharacterCodes.colon: return this.setToken(Token.ColonToken);
            case CharacterCodes.semiColon: return this.setToken(Token.SemiColonToken);
            case CharacterCodes.lessThan: return this.setToken(Token.LessThanToken);
            case CharacterCodes.equals: return this.setToken(Token.EqualsToken);
            case CharacterCodes.greaterThan: return this.setToken(Token.GreaterThanToken);
            case CharacterCodes.question: return this.setToken(Token.QuestionToken);
            case CharacterCodes.at: return this.setToken(Token.AtToken);
            case CharacterCodes.openBracket: return this.setToken(Token.OpenBracketToken);
            case CharacterCodes.backslash: return this.setToken(Token.BackslashToken);
            case CharacterCodes.closeBracket: return this.setToken(Token.CloseBracketToken);
            case CharacterCodes.caret: return this.setToken(Token.CaretToken);
            case CharacterCodes._: return this.setToken(Token.UnderscoreToken);
            case CharacterCodes.backtick: return this.setToken(Token.BacktickToken);
            case CharacterCodes.openBrace: return this.setToken(Token.OpenBraceToken);
            case CharacterCodes.bar: return this.setToken(Token.BarToken);
            case CharacterCodes.closeBrace: return this.setToken(Token.CloseBraceToken);
            case CharacterCodes.tilde: return this.setToken(Token.TildeToken);
            default:
                if (UnicodeUtils.isDecimalDigit(codePoint)) {
                    this._preprocessor.advance(this._preprocessor.peekCount(0, UnicodeUtils.isDecimalDigit));
                    return this.setToken(Token.DecimalDigits);
                }
                if (UnicodeUtils.isAsciiWhitespace(codePoint)) {
                    return this.setToken(Token.OtherAsciiWhitespaceTrivia);
                }
                if (UnicodeUtils.isUnicodeWhitespace(codePoint)) {
                    return this.setToken(Token.OtherUnicodeWhitespaceTrivia);
                }
                if (UnicodeUtils.isUnicodePunctuation(codePoint)) {
                    return this.setToken(Token.UnicodePunctuationToken);
                }
                return this.setToken(Token.Text);
        }
    }

    /**
     * If the current token matches the provided expectation, scans the next token using the default rules.
     * @param expectation The token or token test used to check the current token.
     */
    public scanOptional(expectation: Token | ((value: Token) => boolean)): boolean {
        if (typeof expectation === "function" ? expectation(this.token()) : this.token() === expectation) {
            this.scan();
            return true;
        }
        return false;
    }

    /**
     * Scans the rest of the line starting at the start position of the current token, but excluding the line ending.
     */
    public scanLine(): string {
        let s: string = '';
        if (this._partialTabColumns) {
            let charsToTab: number = 4 - (this.startColumn % 4);
            while (charsToTab > 0) {
                s += ' ';
                charsToTab--;
            }
            this.scan();
        }
        const pos: number = this.startPos;
        while (!Token.isLineEnding(this.token())) {
            this.scan();
        }
        return s + this.slice(pos, this.startPos);
    }

    /**
     * Skips whitespace characters (excluding line endings).
     * @returns `true` if any whitespace characters where skipped; otherwise, `false`.
     */
    public scanWhitespace(): boolean {
        let hasWhitespace: boolean = false;
        while (Token.isWhitespaceCharacter(this.token()) && this.token() !== Token.NewLineTrivia) {
            hasWhitespace = true;
            this.scan();
        }
        return hasWhitespace;
    }

    /**
     * Skips whitespace characters, including up to one line ending.
     * @returns `true` if any whitespace characters where skipped; otherwise, `false`.
     */
    public scanWhitespaceAndSingleLine(): boolean {
        let hasWhitespace: boolean = this.scanWhitespace();
        if (this.token() === Token.NewLineTrivia) {
            this.scan();
            this.scanWhitespace();
            hasWhitespace = true;
        }
        return hasWhitespace;
    }

    /**
     * Skips whitespace characters, including line endings.
     * @returns `true` if any whitespace characters where skipped; otherwise, `false`.
     */
    public scanWhitespaceAndNewLines(): boolean {
        let hasWhitespace: boolean = false;
        while (this.scanWhitespaceAndSingleLine()) {
            hasWhitespace = true;
        }
        return hasWhitespace;
    }

    /**
     * Advances the scanner the specified number of columns.
     */
    public scanColumns(columnCount: number): void {
        while (columnCount > 0) {
            this.scan(/*columns*/ true);
            columnCount--;
        }
    }

    private _rescanPartialTabTrivia(): Token {
        if (this._token === Token.TabTrivia) {
            this._partialTabColumns = this._preprocessor.column - this._startColumn - 1;
            return this.setToken(Token.PartialTabTrivia);
        }
        return this._token;
    }

    /**
     * Gets the last scanned token.
     * 
     * NOTE: This is implemented as a method and not as an accessor so that TypeScript's control flow does not
     * lock in a specific token type in conditional and loop statements.
     */
    public token(): Token {
        return this._token;
    }

    /**
     * Gets the underlying raw text of the token.
     */
    public getTokenText(): string {
        return this.slice(this._startPos, this.pos);
    }

    /**
     * Gets the specific value of a token (such as the unquoted value of a quoted string).
     */
    public getTokenValue(): string {
        return this._tokenValue !== undefined ? this._tokenValue : this.getTokenText();
    }

    /**
     * Sets the last scanned token to the provided value. Primarily used in callbacks provided to `rescan`.
     * @param token The new token.
     * @param tokenValue An optional token value for the new token.
     */
    public setToken<T extends Token>(token: T, tokenValue?: string): T {
        this._lastState = undefined;
        this._token = token;
        this._tokenValue = tokenValue;
        return token;
    }

    /**
     * Attempt to rescan a token. The callback should call `setToken` to set the token with a value.
     * @param lookAhead Indicates whether the position should be unconditionally reset when the callback completes.
     * @param cb The callback to execute. If the return value is `undefined`, then the position will be reset.
     */
    public rescan<A extends any[]>(cb: (scanner: Scanner, ...args: A) => Token | undefined, ...args: A): Token {
        const token: Token | undefined = this.speculate(/*lookAhead*/ false, Scanner._rescan, this, cb, args);
        return token === undefined ? this.token() : token !== this.token() ? this.setToken(token) : token;
    }

    private static _rescan<A extends any[]>(scanner: Scanner, cb: (scanner: Scanner, ...args: A) => Token | undefined, args: A): Token | undefined {
        return cb(scanner, ...args);
    }

    /**
     * Performs lookahead. After the callback has executed, the scanner's state is restored to its previous state.
     * @param cb The callback to execute.
     */
    public lookAhead<A extends any[], T>(cb: (scanner: Scanner, ...args: A) => T, ...args: A): T {
        return this.speculate(/*lookAhead*/ true, cb.bind(undefined, this), ...args);
    }

    /**
     * Perform speculation.
     * @param lookAhead Indicates whether the position should be unconditionally reset when the callback completes.
     * @param cb The callback to execute. If the return value is `undefined`, then the position will be reset.
     */
    public speculate<A extends any[], T>(lookAhead: boolean, cb: (...args: A) => T, ...args: A): T {
        const savedStartPos: number = this._startPos;
        const savedStartColumn: number = this._startColumn;
        const savedToken: Token = this._token;
        const savedTokenValue: string | undefined = this._tokenValue;
        const savedPartialTabColumns: number = this._partialTabColumns;
        let result!: T;
        try {
            result = this._preprocessor.speculate(lookAhead, cb, ...args);
        } finally {
            if (lookAhead || result === undefined) {
                this._startPos = savedStartPos;
                this._startColumn = savedStartColumn;
                this._token = savedToken;
                this._tokenValue = savedTokenValue;
                this._partialTabColumns = savedPartialTabColumns;
            }
        }
        return result;
    }

    // TODO(rbuckton): Move this to more specific rescanners where appropriate.
    public static rescanString(scanner: Scanner, options: IRescanStringOptions): Token | undefined {
        const {
            token,
            openQuote,
            closeQuote = openQuote,
            stop,
            nonEmpty = closeQuote === undefined,
            nonWhitespace,
            noBlankLines,
            maxSize,
            includeQuotes,
        } = options;

        const balanced: boolean = !!options.balanced && openQuote !== undefined && closeQuote !== undefined && closeQuote !== openQuote;

        const openBracket: number | undefined =
            options.openBracket !== options.openQuote &&
            options.openBracket !== options.closeQuote &&
            options.openBracket !== options.closeBracket ? options.openBracket : undefined;

        const closeBracket: number | undefined =
            options.closeBracket !== options.openQuote &&
            options.closeBracket !== options.closeQuote &&
            options.openBracket !== options.closeBracket ? options.closeBracket : undefined;

        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);

        let tokenStart: number = preprocessor.pos;
        let openQuoteCount: number = 0;
        if (openQuote !== undefined) {
            if (preprocessor.peek(0) !== openQuote) {
                return undefined;
            } else {
                if (balanced) {
                    openQuoteCount++;
                }

                preprocessor.read();
                if (!includeQuotes) {
                    tokenStart = preprocessor.pos;
                }
            }
        }

        let openBracketCount: number = 0;
        let start: number = tokenStart;
        let lineHasNonWhitespaceCharacter: boolean | undefined = undefined;
        let hasNonWhitespaceCharacter: boolean = false;
        let tokenValue: string = "";
        for (;;) {
            // peek at the next character
            const codePoint: number | undefined = preprocessor.peek(0);

            if (codePoint === undefined) {
                if (closeQuote !== undefined) {
                    // unterminated
                    return undefined;
                }
                break;
            }

            if (codePoint === closeQuote) {
                if (balanced) {
                    openQuoteCount--;
                }
                if (openQuoteCount === 0) {
                    break;
                }
            } else if (codePoint === openQuote) {
                if (!balanced) {
                    // unterminated
                    return undefined;
                }
                openQuoteCount++;
            } else if (codePoint === openBracket) {
                openBracketCount++;
            } else if (codePoint === closeBracket) {
                openBracketCount--;
            }

            if (stop && stop(codePoint)) {
                if (closeQuote !== undefined) {
                    // unterminated
                    return undefined;
                }
                break;
            }

            if (maxSize !== undefined && preprocessor.pos - tokenStart > maxSize) {
                // too many characters
                return undefined;
            }

            if (!lineHasNonWhitespaceCharacter && !UnicodeUtils.isAsciiWhitespace(codePoint)) {
                lineHasNonWhitespaceCharacter = true;
                hasNonWhitespaceCharacter = true;
            }

            if (noBlankLines && UnicodeUtils.isLineTerminator(codePoint)) {
                if (lineHasNonWhitespaceCharacter === false) {
                    return undefined;
                }
                lineHasNonWhitespaceCharacter = false;
            }

            if (codePoint === CharacterCodes.backslash) {
                const nextCodePoint: number | undefined = preprocessor.peek(1);
                if (UnicodeUtils.isAsciiPunctuation(nextCodePoint)) {
                    // commit portion of string prior to `/`
                    tokenValue += preprocessor.slice(start, preprocessor.pos) + UnicodeUtils.stringFromCodePoint(nextCodePoint);
                    // consume the backslash and punctuation
                    preprocessor.advance(2);
                    // set new substring start
                    start = preprocessor.pos;
                    continue;
                }
            }

            // consume the character
            preprocessor.read();
        }

        if (nonWhitespace && !hasNonWhitespaceCharacter ||
            nonEmpty && preprocessor.pos === tokenStart ||
            openBracketCount > 0 ||
            closeQuote !== undefined && preprocessor.peek(0) !== closeQuote) {
            return undefined;
        }

        // commit remaining portion of string
        let tokenEnd: number = preprocessor.pos;
        if (closeQuote !== undefined) {
            preprocessor.read();
            if (includeQuotes) {
                tokenEnd = preprocessor.pos;
            }
        }

        tokenValue += preprocessor.slice(start, tokenEnd);
        return scanner.setToken(token, tokenValue);
    }

    public debugString(): string {
        function countColumns(text: string): number {
            let count: number = 0;
            for (let i = 0; i < text.length; i++) {
                if (text.charCodeAt(i) === CharacterCodes.tab) {
                    count += 4;
                } else {
                    count++;
                }
            }
            return count;
        }

        const lineMap: LineMap = new LineMap(this.text);
        const lines: string[] = this.text.split(/\r\n?|[\n\u2028\u2029]/g);
        const lineNumberLength: number = lines.length.toString().length + 2;
        const tokenStart: Position = lineMap.positionAt(this.startPos);
        const tokenEnd: Position = lineMap.positionAt(this.pos);
        let s: string = '';
        for (let i: number = 0; i < lines.length; i++) {
            s += '\n';
            const lineNumber: string = `${i + 1}> `;
            const line: string = lines[i];
            s += StringUtils.repeat(' ', lineNumberLength - lineNumber.length);
            s += lineNumber;
            s += line;
            if (i >= tokenStart.line && i <= tokenEnd.line) {
                s += '\n';
                s += StringUtils.repeat(' ', lineNumberLength);
                if (i === tokenStart.line && i === tokenEnd.line) {
                    // start and end on same line
                    s += StringUtils.repeat(' ', countColumns(line.slice(0, tokenStart.character)));
                    s += StringUtils.repeat(`^`, countColumns(line.slice(tokenStart.character, tokenEnd.character)));
                } else if (i === tokenStart.line) {
                    // start on this line
                    s += StringUtils.repeat(' ', countColumns(line.slice(0, tokenStart.character)));
                    s += StringUtils.repeat(`^`, countColumns(line.slice(tokenStart.character)));
                } else if (i === tokenEnd.line) {
                    // end on this line
                    s += StringUtils.repeat(`^`, countColumns(line.slice(0, tokenEnd.character)));
                } else {
                    // continues through this line
                    s += StringUtils.repeat(`^`, countColumns(line));
                }
                if (i === tokenStart.line) {
                    s += '\n';
                    s += StringUtils.repeat(' ', lineNumberLength);
                    s += StringUtils.repeat(' ', countColumns(line.slice(0, tokenStart.character)));
                    s += 'token: ' + (Token as any)[this.token()];
                    if (this.getTokenValue() !== this.getTokenText()) {
                        s += '\n';
                        s += StringUtils.repeat(' ', lineNumberLength);
                        s += StringUtils.repeat(' ', countColumns(line.slice(0, tokenStart.character)));
                        s += 'value: ' + this.getTokenValue();
                    }
                }
            }
        }
        return s + '\n';
    }
}
