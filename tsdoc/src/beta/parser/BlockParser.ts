import { Scanner, IScannerState } from "./Scanner";
import { Token } from "./Token";
import { SyntaxKind } from "../nodes/SyntaxKind";
import { StartResult, ContinueResult, IBlockSyntaxParser } from "./blockParsers/IBlockSyntaxParser";
import { DocumentParser } from "./blockParsers/DocumentParser";
import { DocBlockTagParser } from "./blockParsers/DocBlockTagParser";
import { MarkdownBlockQuoteParser } from "./blockParsers/MarkdownBlockQuoteParser";
import { MarkdownHeadingParser } from "./blockParsers/MarkdownHeadingParser";
import { MarkdownCodeBlockParser } from "./blockParsers/MarkdownCodeBlockParser";
import { MarkdownHtmlBlockParser } from "./blockParsers/MarkdownHtmlBlockParser";
import { MarkdownThematicBreakParser } from "./blockParsers/MarkdownThematicBreakParser";
import { MarkdownListParser } from "./blockParsers/MarkdownListParser";
import { MarkdownListItemParser } from "./blockParsers/MarkdownListItemParser";
import { MarkdownParagraphParser } from "./blockParsers/MarkdownParagraphParser";
import { InlineParser } from "./InlineParser";
import { Document } from "../nodes/Document";
import { Node } from "../nodes/Node";
import { MarkdownCodeBlock } from "../nodes/MarkdownCodeBlock";
import { MarkdownParagraph } from "../nodes/MarkdownParagraph";
import { Block } from "../nodes/Block";
import { ContentWriter } from "./ContentWriter";
import { IMapping } from "./Preprocessor";
import { ParserBase } from "./ParserBase";

export class BlockParser extends ParserBase {
    private _line: number;
    private _linePos: number;
    private _indent: number;
    private _blank: boolean;
    private _indentStart: IScannerState | undefined;
    private _lastNextNonIndentPos: number;
    private _previousLineEnd: number;
    private _root!: Document;
    private _lastMatch: Block | undefined;
    private _hasUnmatchedBlocks: boolean;
    private _tip: Block | undefined;
    private _lastTip: Block | undefined;
    private _blockSyntaxParserMap: Map<SyntaxKind, IBlockSyntaxParser<Block>>;
    private _blockSyntaxParsers: ReadonlyArray<IBlockSyntaxParser<Block>>;

    public constructor(text: string, sourceMappings?: IMapping[]) {
        super(text, sourceMappings);
        this._line = 0;
        this._linePos = 0;
        this._indent = 0;
        this._blank = false;
        this._lastNextNonIndentPos= -1;
        this._previousLineEnd= -1;
        this._hasUnmatchedBlocks = false;
        this._blockSyntaxParsers = BlockParser.getDefaultBlockSyntaxParsers();
            this._blockSyntaxParserMap = new Map();
        for (const blockSyntaxParser of this._blockSyntaxParsers) {
            this._blockSyntaxParserMap.set(blockSyntaxParser.kind, blockSyntaxParser);
        }
    }

    /**
     * Gets the state of the scanner before the current indent.
     */
    public get indentStartState(): IScannerState | undefined {
        return this._indentStart;
    }

    /**
     * Gets the position at which the current indent started.
     */
    public get indentStartPos(): number {
        return this._indentStart ? this._indentStart.startPos : this._linePos;
    }

    /**
     * Gets the current indent depth relative to the current tip.
     */
    public get indent(): number {
        return this._indent;
    }

    /**
     * Gets the current tip.
     */
    public get tip(): Block | undefined {
        return this._tip;
    }

    /**
     * Gets a value indicating whether the current line is blank.
     */
    public get blank(): boolean {
        return this._blank;
    }

    /**
     * Gets the default parsers used to parse block syntax.
     */
    public static getDefaultBlockSyntaxParsers(): ReadonlyArray<IBlockSyntaxParser<Block>> {
        return [
            DocumentParser,
            DocBlockTagParser,
            MarkdownBlockQuoteParser,
            MarkdownHeadingParser,
            MarkdownCodeBlockParser,
            MarkdownHtmlBlockParser,
            MarkdownThematicBreakParser,
            MarkdownListParser,
            MarkdownListItemParser,
            MarkdownParagraphParser
        ];
    }

    public parse(): Document {
        this._line = 0;
        this._linePos = 0;
        this._indentStart = undefined;
        this._indent = 0;
        this._blank = false;
        this._lastNextNonIndentPos = -1;
        this._previousLineEnd = 0;
        this._root = new Document({ pos: 0, text: this.scanner.text });
        this._tip = this._root;
        this._lastMatch = this._root;
        this._hasUnmatchedBlocks = false;

        // prime the scanner with the first token
        this.scanner.scan();
        while (this.scanner.token() !== Token.EndOfFileToken) {
            this._parseLine();
            if (!Token.isLineEnding(this.scanner.token())) {
                throw new Error("Expected to be at end of line or end of input.");
            }
            this._previousLineEnd = this.scanner.startPos;
            this._linePos = this.scanner.pos;
            this._line++;
            this.scanner.scan();
        }
        while (this._tip) {
            this.finish(this._tip, this._previousLineEnd);
        }
        this._processInlines(this._root);
        return this._root;
    }

    private _parseLine(): void {
        let block: Block | undefined = this._root;
        this._lastTip = this._tip;

        // step 1: attempt to continue any open blocks that can accept the current line
        let nextBlock: Block | undefined = block.lastChildBlock;
        while (nextBlock && !this.getParserState(nextBlock).closed) {
            block = nextBlock;
            switch (this._continue(block)) {
                case ContinueResult.Matched:
                    // this.acceptIndent();
                    nextBlock = block.lastChildBlock;
                    continue;
                case ContinueResult.Finished:
                    return;
                case ContinueResult.Unmatched:
                    block = block.parentBlock || this._root;
                    break;
            }
            break;
        }

        this._hasUnmatchedBlocks = block !== this._lastTip;
        this._lastMatch = block;

        // step 2: if the line hasn't already been consumed, start a new block if possible
        let matchedLeaf: boolean = block.kind !== SyntaxKind.MarkdownParagraph && this._acceptsLines(block);
        while (block && !matchedLeaf) {
            switch (this._start(block)) {
                case StartResult.Container:
                    // this.acceptIndent();
                    block = this._tip;
                    continue;
                case StartResult.Leaf:
                    // this.acceptIndent();
                    block = this._tip;
                    matchedLeaf = true;
                    break;
            }
            break;
        }

        // step 3: any remaining content is inline content to be parsed later
        if (this._hasUnmatchedBlocks && !this._blank && this._tip && this._tip.kind === SyntaxKind.MarkdownParagraph) {
            // continue a paragraph
            this._acceptLine(this._tip);
        } else if (block) {
            this.finishUnmatchedBlocks();

            if (this._blank) {
                const lastChild: Block | undefined = block.lastChildBlock;
                if (lastChild) {
                    this.getParserState(lastChild).lastLineIsBlank = true;
                }
            }

            const lastLineIsBlank: boolean = this._blank &&
                !(block.kind === SyntaxKind.MarkdownBlockQuote ||
                    block.kind === SyntaxKind.MarkdownCodeBlock && !!(block as MarkdownCodeBlock).codeFence ||
                    block.kind === SyntaxKind.MarkdownListItem && !block.firstChild && this.lineMap.lineAt(block.pos) === this._line);

            let ancestor: Block | undefined = block;
            while (ancestor) {
                this.getParserState(ancestor).lastLineIsBlank = lastLineIsBlank;
                ancestor = ancestor.parentBlock;
            }

            this._acceptLine(block);
        } 

        // if for some reason we are not at the end of the line, skip to the end of the line
        this.scanner.scanLine();
    }

    private _acceptLine(block: Block): void {
        const blockSyntaxParser: IBlockSyntaxParser<Block> | undefined = this._blockSyntaxParserMap.get(block.kind);
        if (blockSyntaxParser && blockSyntaxParser.acceptLine) {
            blockSyntaxParser.acceptLine(this, block);
        } else if (!Token.isLineEnding(this.scanner.token()) && !this._blank) {
            const pos: number = this.indentStartPos;
            const block: MarkdownParagraph = this.pushBlock(new MarkdownParagraph({ pos, end: pos }));
            MarkdownParagraphParser.acceptLine(this, block);
        }
        this.scanner.scanLine();
    }

    private _start(container: Block): StartResult {
        this.nextNonIndent();
        for (const blockSyntaxParser of this._blockSyntaxParsers) {
            const startResult: StartResult = blockSyntaxParser.tryStart(this, container);
            if (startResult !== StartResult.Unmatched) {
                return startResult;
            }
        }
        return StartResult.Unmatched;
    }

    private _continue(block: Block): ContinueResult {
        this.nextNonIndent();
        const blockSyntaxParser: IBlockSyntaxParser<Block> | undefined = this._blockSyntaxParserMap.get(block.kind);
        return blockSyntaxParser ? blockSyntaxParser.tryContinue(this, block) : ContinueResult.Unmatched;
    }

    public finish(block: Block, end: number = this._previousLineEnd): void {
        const parent: Block | undefined = block.parentBlock;
        this.getParserState(block).closed = true;
        block.end = end;
        try {
            const blockSyntaxParser: IBlockSyntaxParser<Block> | undefined = this._blockSyntaxParserMap.get(block.kind);
            if (blockSyntaxParser) {
                blockSyntaxParser.finish(this, block);
            }
        } finally {
            this._tip = parent;
        }
    }

    public finishUnmatchedBlocks(): void {
        if (this._hasUnmatchedBlocks) {
            while (this._lastTip && this._lastTip !== this._lastMatch) {
                const parent: Block | undefined = this._lastTip.parentBlock;
                this.finish(this._lastTip);
                this._lastTip = parent;
            }
            this._hasUnmatchedBlocks = false;
        }
    }

    public pushBlock<T extends Block>(block: T, pos?: number, end?: number): T {
        if (pos !== undefined) {
            block.pos = pos;
            if (end !== undefined) {
                block.end = end;
            }
        }
        while (this._tip && !this._tip.canHaveChild(block)) {
            const parent: Block | undefined = this._tip.parentBlock;
            this.finish(this._tip);
            this._tip = parent;
        }
        if (this._tip) {
            this._tip.appendChild(block);
            this._tip = block;
        }
        return block;
    }

    public setTip<T extends Block>(block: T): T {
        this._tip = block;
        return block;
    }

    public nextNonIndent(): void {
        // check whether we've advanced the scanner.
        if (this._lastNextNonIndentPos === this.scanner.startPos) {
            return;
        }
        const column: number = this.scanner.startColumn;
        this._indentStart = this.scanner.getState();
        while (Token.isIndentCharacter(this.scanner.token())) {
            this.scanner.scan();
        }
        this._blank = Token.isLineEnding(this.scanner.token());
        this._indent = this.scanner.startColumn - column;
        this._lastNextNonIndentPos = this.scanner.startPos;
    }

    public acceptIndent(): void {
        this._blank = false;
        this._indentStart = undefined;
        this._indent = 0;
        this._lastNextNonIndentPos = -1;
    }

    public retreatToIndentStart(): void {
        this.scanner.setState(this._indentStart);
        this.acceptIndent();
    }

    public parseReferences(block: MarkdownParagraph): void {
        const content: ContentWriter | undefined = this.getParserState(block).content;
        if (content) {
            const parser: InlineParser = new InlineParser(this._root, content.toString(), content.mappings);
            for (const linkReference of parser.parseReferences()) {
                block.insertSiblingBefore(linkReference);
            }

            const scanner: Scanner = parser.scanner;
            if (scanner.token() === Token.EndOfFileToken) {
                this.getParserState(block).content = undefined;
                return;
            }

            if (scanner.startPos === 0) {
                return;
            }
            
            let sourcePos: number = scanner.startPos;
            const newContent: ContentWriter = new ContentWriter();
            newContent.addMapping(scanner.startPos);
            for (const sourceSegment of content.mappings) {
                if (sourceSegment.sourcePos > sourcePos) {
                    newContent.write(scanner.slice(sourcePos, sourceSegment.sourcePos));
                    newContent.addMapping(sourceSegment.sourcePos);
                    sourcePos = sourceSegment.sourcePos;
                }
            }
            newContent.write(scanner.slice(sourcePos));
            this.getParserState(block).content = newContent;
        }
    }

    private _acceptsLines(block: Node): boolean {
        const parser: IBlockSyntaxParser<Block> | undefined = this._blockSyntaxParserMap.get(block.kind);
        return parser && !!parser.acceptLine || false;
    }

    public endsWithBlankLine(block: Block): boolean {
        let current: Block | undefined = block;
        while (current) {
            if (this.getParserState(current).lastLineIsBlank) {
                return true;
            }
            if (!this.getParserState(current).lastLineChecked) {
                this.getParserState(current).lastLineChecked = true;
                if (current.isList()) {
                    current = current.lastChildListItem;
                    continue;
                }
                if (current.isListItem()) {
                    current = current.lastChildBlock;
                    continue;
                }
            }
            break;
        }
        return false;
    }

    private _processInlines(block: Block): void {
        if (block.isInlineContainer()) {
            const content: ContentWriter | undefined = this.getParserState(block).content;
            if (content && content.length) {
                const parser = new InlineParser(this._root, content.toString(), content.mappings);
                parser.parse(block);
            }
            this.getParserState(block).content = undefined;
        } else {
            block.forEachChild(child => {
                if (child.isBlock()) {
                    this._processInlines(child);
                }
            });
        }
    }
}
