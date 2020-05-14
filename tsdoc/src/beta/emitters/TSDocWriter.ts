import { MarkdownUtils } from "../utils/MarkdownUtils";
import { Node } from "../nodes/Node";
import { Content } from "../nodes/Content";
import { SyntaxElement } from "../nodes/SyntaxElement";

export interface IBlockInfo {
    indent?: number;
    firstLinePrefix?: string;
    linePrefix?: string;
}

interface IBlockState extends IBlockInfo {
    firstLine: boolean;
    indentString?: string;
}

export class TSDocWriter {
    private _blocks: IBlockState[] = [];
    private _text: string = '';
    private _atStartOfLine: boolean = false;
    private _emit: (node: Node) => void;

    constructor(emit: (node: Node) => void) {
        this._emit = emit;
    }

    public pushBlock(block: IBlockInfo): void {
        this._blocks.push({ ...block, firstLine: true });
        this._atStartOfLine = true;
    }

    public popBlock(): void {
        this._blocks.pop();
    }

    public write(text: string): void {
        this._writeBlocksIfNeeded();
        this._text += text;
    }

    public writeEscaped(text: string): void {
        this.write(MarkdownUtils.escapeString(text, {
            atStartOfLine: this._atStartOfLine
        }));
    }

    public writeln(): void {
        this._writeBlocksIfNeeded();
        this._text += '\n';
        this._atStartOfLine = true;
    }

    public writeSyntax(node: SyntaxElement): void {
        this._emit(node);
    }

    public writeContents(node: Content): void {
        node.forEachChild(this._emit);
    }

    public toString(): string {
        return this._text;
    }

    private _writeBlocksIfNeeded(): void {
        if (this._atStartOfLine) {
            this._atStartOfLine = false;
            for (const block of this._blocks) {
                if (block.indent) {
                    if (!block.indentString) {
                        block.indentString = '';
                        for (let i = 0; i < block.indent; i++) {
                            block.indentString += ' ';
                        }
                    }
                    this._text += block.indentString;
                }
                if (block.firstLine && block.firstLinePrefix) {
                    block.firstLine = false;
                    this._text += block.firstLinePrefix;
                } else if (block.linePrefix) {
                    this._text += block.linePrefix;
                }
            }
        }
    }
}