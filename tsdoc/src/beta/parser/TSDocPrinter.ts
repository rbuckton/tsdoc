import { MarkdownUtils } from "./utils/MarkdownUtils";

export interface IBlockInfo {
    indent?: number;
    firstLinePrefix?: string;
    linePrefix?: string;
}

interface IBlockState extends IBlockInfo {
    firstLine: boolean;
    indentString?: string;
}

export class TSDocPrinter {
    private _blocks: IBlockState[] = [];
    private _text: string = '';
    private _atStartOfLine: boolean = false;

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