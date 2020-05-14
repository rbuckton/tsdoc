import { IScannerState } from "./Scanner";
import { Token } from "./Token";
import { SyntaxKind } from "../nodes/SyntaxKind";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { DocumentSyntax } from "../syntax/tsdoc/block/DocumentSyntax";
import { DocBlockTagSyntax } from "../syntax/tsdoc/block/DocBlockTagSyntax";
import { MarkdownHeadingSyntax } from "../syntax/commonmark/block/MarkdownHeadingSyntax";
import { MarkdownCodeBlockSyntax } from "../syntax/commonmark/block/MarkdownCodeBlockSyntax";
import { MarkdownHtmlSyntax } from "../syntax/commonmark/block/MarkdownHtmlSyntax";
import { MarkdownThematicBreakSyntax } from "../syntax/commonmark/block/MarkdownThematicBreakSyntax";
import { MarkdownListSyntax } from "../syntax/commonmark/block/MarkdownListSyntax";
import { MarkdownListItemSyntax } from "../syntax/commonmark/block/MarkdownListItemSyntax";
import { MarkdownParagraphSyntax } from "../syntax/commonmark/block/MarkdownParagraphSyntax";
import { InlineParser } from "./InlineParser";
import { Document } from "../nodes/Document";
import { Node } from "../nodes/Node";
import { MarkdownCodeBlock } from "../nodes/MarkdownCodeBlock";
import { MarkdownParagraph } from "../nodes/MarkdownParagraph";
import { Block } from "../nodes/Block";
import { ContentWriter } from "./ContentWriter";
import { IMapping } from "./Mapper";
import { ParserBase } from "./ParserBase";
import { GfmTableSyntax } from "../syntax/gfm/block/GfmTableSyntax";
import { GfmTaskListItemSyntax } from "../syntax/gfm/block/GfmTaskListItemSyntax";
import { GfmTaskListSyntax } from "../syntax/gfm/block/GfmTaskListSyntax";
import { MarkdownBlockQuoteSyntax } from "../syntax/commonmark/block/MarkdownBlockQuoteSyntax";
import { GfmTableRowSyntax } from "../syntax/gfm/block/GfmTableRowSyntax";
import { GfmTableCellSyntax } from "../syntax/gfm/block/GfmTableCellSyntax";
import { SyntaxKindUtils } from "../utils/SyntaxKindUtils";
import { Content } from "../nodes/Content";

// @ts-ignore
function ASSERT(condition: any, message?: string): void {
    if (!condition) {
        const error = new Error(message);
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(error, ASSERT);
        }
        throw error;
    }
}

interface IBlockState {
    closed?: boolean;
    lastLineIsBlank?: boolean;
    lastLineChecked?: boolean;
}

function createBlockState(): IBlockState {
    return {};
}

function getState(parser: BlockParser, node: Node): IBlockState {
    return parser.getState(parser, node, createBlockState);
}

export class BlockParser extends ParserBase {
    private _current!: Block;
    private _line: number;
    private _linePos: number;
    private _blank: boolean;
    private _indent: number;
    private _indentStart: IScannerState | undefined;
    private _lastNextNonIndentPos: number;
    private _previousLineEnd: number;
    private _root!: Document;
    private _blockSyntaxParsers: ReadonlyArray<IBlockSyntax<Block>>;
    private _gfm: boolean;

    public constructor(text: string, sourceMappings?: IMapping[], gfm?: boolean) {
        super(text, sourceMappings);
        this._line = 0;
        this._linePos = 0;
        this._indent = 0;
        this._blank = false;
        this._gfm = !!gfm;
        this._lastNextNonIndentPos = -1;
        this._previousLineEnd = -1;
        this._blockSyntaxParsers = BlockParser.getDefaultBlockSyntaxParsers(this._gfm);
    }

    public get gfm(): boolean {
        return this._gfm;
    }

    /**
     * Gets the root document for the parser.
     */
    public get document(): Document {
        if (!this._root) throw new Error('Parser has not yet started parsing.');
        return this._root;
    }

    /**
     * Gets the current block for the parser.
     */
    public get current(): Block {
        if (!this._root) throw new Error('Parser has not yet started parsing.');
        return this._current
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
     * Gets whether the current block is indented by four or more columns.
     */
    public get indented(): boolean {
        return this.indent >= 4;
    }

    /**
     * Gets the current indent depth relative to the current tip.
     */
    public get indent(): number {
        return this._indent;
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
    public static getDefaultBlockSyntaxParsers(gfm: boolean): ReadonlyArray<IBlockSyntax<Block>> {
        return [
            DocumentSyntax,
            DocBlockTagSyntax,
            MarkdownBlockQuoteSyntax,
            MarkdownHeadingSyntax,
            MarkdownCodeBlockSyntax,
            MarkdownHtmlSyntax,
            MarkdownThematicBreakSyntax,
            ...(gfm ? [GfmTaskListSyntax, GfmTaskListItemSyntax] : []),
            MarkdownListSyntax,
            MarkdownListItemSyntax,
            ...(gfm ? [GfmTableSyntax, GfmTableRowSyntax, GfmTableCellSyntax] : []),
            MarkdownParagraphSyntax
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
        this._current = this._root;

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
        while (this._current !== this._root) {
            this._current = this.finish(this._current);
        }
        this._finish(this._root);
        this._processInlines(this._root);
        return this._root;
    }

    private _tryContinue(): Block | undefined {
        let block: Block | undefined = this._root;

        let lastChild: Content | undefined = block.lastChild;
        let lastChildBlock: Block | undefined = lastChild && lastChild.isBlock() ? lastChild : undefined;
        while (lastChildBlock && !getState(this, lastChildBlock).closed) {
            block = lastChildBlock;
            this.nextNonIndent();
            const syntax: IBlockSyntax<Block> = block.syntax;
            if (syntax && syntax.tryContinueBlock(this, block)) {
                // block was finished while continuing
                if (getState(this, block).closed) {
                    const parent: Content | undefined = block.parentContent;
                    ASSERT(parent && parent.isBlock(), `Expected finished block to have a parent.`);
                    this._current = parent as Block;
                    return undefined;
                }
                lastChild = block.lastChild;
                lastChildBlock = lastChild && lastChild.isBlock() ? lastChild : undefined;
                continue;
            } else {
                const parent: Content | undefined = block.parentContent;
                return parent && parent.isBlock() ? parent : this._root;
            }
        }
        return block;
    }

    private _tryStart(block: Block): Block {
        if (block.kind === SyntaxKind.MarkdownParagraph || !this._acceptsLines(block)) {
            let newBlock: Block | undefined;
            do {
                this.nextNonIndent();
                for (const blockSyntaxParser of this._blockSyntaxParsers) {
                    newBlock = this.tryParse(blockSyntaxParser.tryStartBlock, block);
                    if (newBlock) {
                        block = newBlock;
                        break;
                    }
                }
            } while (newBlock && newBlock.isBlockContainer());
        }
        return block;
    }

    private _setLastLineBlank(block: Node, value: boolean): void {
        getState(this, block).lastLineIsBlank = value;
    }

    private _acceptLine(block: Block, lastMatch: Block): void {
        let lastChild: Content | undefined = block.lastChild;
        if (this._blank && lastChild && lastChild.isBlock()) {
            this._setLastLineBlank(lastChild, true);
        }

        const lastLineIsBlank: boolean = this._blank &&
            block.kind !== SyntaxKind.MarkdownBlockQuote &&
            block.kind !== SyntaxKind.MarkdownHeading &&
            block.kind !== SyntaxKind.MarkdownThematicBreak &&
            !(block.kind === SyntaxKind.MarkdownCodeBlock && !!(block as MarkdownCodeBlock).codeFence) &&
            !(block.kind === SyntaxKind.MarkdownListItem && !block.firstChild && this.lineMap.lineAt(block.pos) === this._line);

        this._setLastLineBlank(block, lastLineIsBlank);
        block.forEachAncestor(ancestor => this._setLastLineBlank(ancestor, false));

        if (this._current !== lastMatch && block === lastMatch && !this._blank && this._current.kind === SyntaxKind.MarkdownParagraph) {
            // continue a paragraph
            block = this._current;
        } else {
            while (this._current !== lastMatch) {
                this._current = this.finish(this._current)!;
                ASSERT(this._current);
            }
        }

        let blockSyntaxParser: IBlockSyntax<Block> = block.syntax;
        if (!blockSyntaxParser.acceptLine) {
            if (!Token.isLineEnding(this.scanner.token()) && !this._blank) {
                const pos: number = this.indentStartPos;
                const para: MarkdownParagraph = new MarkdownParagraph({ pos });
                block = this.pushBlock(block, para);
                blockSyntaxParser = block.syntax;
            }
        }

        if (blockSyntaxParser.acceptLine) {
            block = blockSyntaxParser.acceptLine(this, block);
        } else {
            this.scanner.scanLine();
        }

        this._current = block;
    }

    private _parseLine(): void {
        // step 1: attempt to continue any open blocks that can accept the current line
        const lastMatch: Block | undefined = this._tryContinue();
        if (!lastMatch) {
            return;
        }
        const current: Block = this._current;

        // step 2: if the line hasn't already been consumed, start a new block if possible
        const block: Block = this._tryStart(lastMatch);

        // step 3: any remaining content is inline content to be parsed later
        if (current === this._current) {
            this._acceptLine(block, lastMatch);
        }
    }

    private _finish(block: Block): Block | undefined {
        ASSERT(!getState(this, block).closed, `Expected ${SyntaxKindUtils.formatSyntaxKind(block.kind)} to be open`);
        const parent: Content | undefined = block.parentContent;
        getState(this, block).closed = true;
        block.end = this._previousLineEnd;
        const syntaxParser: IBlockSyntax<Block> = block.syntax;
        if (syntaxParser.finishBlock) {
            syntaxParser.finishBlock(this, block);
        }
        return parent && parent.isBlock() ? parent as Block : undefined;
    }

    public finish(block: Block): Block {
        const parent: Block | undefined = this._finish(block);
        ASSERT(parent, `Expected block ${SyntaxKindUtils.formatSyntaxKind(block.kind)} to have a parent.`);
        return parent!;
    }

    public pushBlock<T extends Block>(parent: Block, child: T): T {
        let container: Block | undefined = parent;
        while (container && !container.canHaveChild(child)) {
            container = this.finish(container);
        }
        if (container) {
            container.appendChild(child);
            container = child;
        }
        return child;
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
        MarkdownParagraphSyntax.parseReferences(this, block);
    }

    public getContent(block: Block): ContentWriter | undefined {
        ASSERT(block.syntax, `Expected block ${SyntaxKindUtils.formatSyntaxKind(block.kind)} to have an associated syntax`);
        const blockSyntaxParser: IBlockSyntax<Block> = block.syntax;
        return blockSyntaxParser.getContent && blockSyntaxParser.getContent(this, block);
    }

    private _acceptsLines(block: Block): boolean {
        return !!block.syntax.acceptLine;
    }

    public endsWithBlankLine(block: Block): boolean {
        let current: Block | undefined = block;
        while (current) {
            if (getState(this, current).lastLineIsBlank) {
                return true;
            }
            if (!getState(this, current).lastLineChecked) {
                getState(this, current).lastLineChecked = true;
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

    private _processInlines(node: Node): void {
        if (node.isBlock() && node.isInlineContainer()) {
            // process inlines in container
            const content: ContentWriter | undefined = this.getContent(node);
            if (content && content.length) {
                this.createInlineParser(content.toString(), content.mappings).parse(node);
            }
            return;
        }

        node.forEachNode(element => this._processInlines(element));
    }

    public tryParse<A extends any[], T>(cb: (parser: BlockParser, ...args: A) => T | undefined, ...args: A): T | undefined {
        return this.scanner.speculate(/*lookAhead*/ false, BlockParser._tryParse, cb, this, args);
    }

    private static _tryParse<A extends any[], T>(cb: (parser: BlockParser, ...args: A) => T | undefined, parser: BlockParser, args: A): T | undefined {
        return cb(parser, ...args);
    }

    public createInlineParser(text: string, mappings: ReadonlyArray<IMapping>): InlineParser {
        return new InlineParser(this._root, text, mappings, this._gfm);
    }
}
