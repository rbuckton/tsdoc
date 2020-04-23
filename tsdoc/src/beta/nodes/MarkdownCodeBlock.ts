import { SyntaxKind } from "./SyntaxKind";
import { Block, IBlockParameters } from "./Block";
import { Token } from "../parser/Token";
import { IParserState } from "../parser/ParserBase";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { StringUtils } from "../parser/utils/StringUtils";

export interface ICodeFence {
    readonly token: Token.CodeFence;
    readonly length: number;
    readonly fenceOffset: number;
}

export interface IMarkdownCodeBlockParameters extends IBlockParameters {
    codeFence?: ICodeFence;
    info?: string;
    literal?: string;
}

function equateCodeFences(x: ICodeFence | undefined, y: ICodeFence | undefined): boolean {
    if (x === y) return true;
    if (!x || !y) return false;
    return x.token === y.token
        && x.length === y.length
        && x.fenceOffset === y.fenceOffset;
}

export class MarkdownCodeBlock extends Block {
    private _codeFence: ICodeFence | undefined;
    private _info: string | undefined;
    private _literal: string | undefined;

    public constructor(parameters?: IMarkdownCodeBlockParameters) {
        super(parameters);
        this._codeFence = parameters && parameters.codeFence;
        this._info = parameters && parameters.info;
        this._literal = parameters && parameters.literal;
    }

    public get kind(): SyntaxKind.MarkdownCodeBlock {
        return SyntaxKind.MarkdownCodeBlock;
    }

    public get codeFence(): ICodeFence | undefined {
        return this._codeFence;
    }

    public set codeFence(value: ICodeFence | undefined) {
        if (value) {
            if (!Token.isCodeFence(value.token)) throw new RangeError("Argument out of range: value.token");
            if (value.fenceOffset < 0) throw new RangeError("Argument out of range: value.fenceOffset");
            if (value.length < 3) throw new RangeError("Argument out of range: value.length");
        }
        if (!equateCodeFences(this.codeFence, value)) {
            this.beforeChange();
            this._codeFence = value;
            this.afterChange();
        }
    }

    public get info(): string {
        const state: IParserState | undefined = this.getParserState();
        return (state ? state.info : this._info) || "";
    }

    public set info(value: string) {
        if (this.info !== value) {
            this.beforeChange();
            this._info = value;
            this.afterChange();
        }
    }

    public get literal(): string {
        const state: IParserState | undefined = this.getParserState();
        return (state ? state.literal : this._literal) || "";
    }

    public set literal(value: string) {
        if (this.literal !== value) {
            this.beforeChange();
            this._literal = value;
            this.afterChange();
        }
    }

    /** @override */
    protected applyParserState(state: IParserState): void {
        this._info = state.info;
        this._literal = state.literal;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        if (this.codeFence) {
            printer.pushBlock({ indent: this.codeFence.fenceOffset });
            printer.write(StringUtils.repeat(this.codeFence.token === Token.BacktickCodeFenceToken ? '`' : '~', this.codeFence.length));
            if (this.info) {
                printer.write(' ');
                printer.write(this.info);
            }
            printer.writeln();
            for (const line of this.literal.split(/\r\n?|\n/g)) {
                printer.write(line);
                printer.writeln();
            }
            printer.write(StringUtils.repeat(this.codeFence.token === Token.BacktickCodeFenceToken ? '`' : '~', this.codeFence.length));
            printer.writeln();
            printer.popBlock();
        }
        else {
            printer.pushBlock({ indent: 4 });
            for (const line of this.literal.split(/\r\n?|\n/g)) {
                printer.write(line);
                printer.writeln();
            }
            printer.popBlock();
        }
    }
}
