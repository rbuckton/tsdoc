import { SyntaxKind } from "./SyntaxKind";
import { Block, IBlockParameters } from "./Block";
import { Token } from "../parser/Token";
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

function validateCodeFence(codeFence: ICodeFence | undefined, paramName: string): string | undefined {
    if (codeFence) {
        if (!Token.isCodeFence(codeFence.token)) {
            return `Argument out of range: ${paramName}.token.`;
        }
        if (codeFence.fenceOffset < 0 || codeFence.fenceOffset >= 4) {
            return `Argument out of range: ${paramName}.fenceOffset.`;
        }
        if (codeFence.length < 3) {
            return `Argument out of range: ${paramName}.length.`;
        }
    }
    return undefined;
}

function validateInfo(info: string | undefined, codeFence: ICodeFence | undefined, forCodeFence: boolean): string | undefined {
    if (info &&
        codeFence &&
        codeFence.token === Token.BacktickCodeFenceToken &&
        info.indexOf('`') >= 0) {
        return forCodeFence ?
            'Cannot specify a backtick (\'`\') code fence if the info string contains a backtick.' :
            'The info string of a code block with a backtick (\'`\') code fence cannot include a backtick.';
    }
    return undefined;
}

function validateLiteral(literal: string | undefined, codeFence: ICodeFence | undefined, forCodeFence: boolean): string | undefined {
    if (literal && codeFence) {
        const codeFenceToken: string = StringUtils.repeat(codeFence.token === Token.BacktickCodeFenceToken ? '`' : '~', codeFence.length);
        const codeFenceRegExp: RegExp = new RegExp(`^\\s{0,3}${codeFenceToken}\\s*$`, 'm');
        if (codeFenceRegExp.test(literal)) {
            const codeFenceKind: string = codeFence.token === Token.BacktickCodeFenceToken ? 'backtick (\'`\')' : 'tilde (\'~\')';
            return forCodeFence ?
                `Cannot specify a ${codeFenceKind} code fence if the literal of the code block includes a line containing only '${codeFenceToken}' indented less than 4 spaces.` :
                `The literal string of a code block with a ${codeFenceKind} code fence may not include a line containing only '${codeFenceToken}' indented less than 4 spaces.`;
        }
    }
    return undefined;
}

export class MarkdownCodeBlock extends Block {
    private _codeFence: ICodeFence | undefined;
    private _info: string | undefined;
    private _literal: string | undefined;

    public constructor(parameters: IMarkdownCodeBlockParameters = {}) {
        super(parameters);
        const { codeFence, info, literal } = parameters;
        const message: string | undefined =
            validateCodeFence(codeFence, 'parameters.codeFence') ||
            validateInfo(info, codeFence, /*forCodeFence*/ false) ||
            validateLiteral(literal, codeFence, /*forCodeFence*/ false);
        if (message) throw new Error(message);
        this._codeFence = codeFence;
        this._info = info;
        this._literal = literal;
    }

    public get kind(): SyntaxKind.MarkdownCodeBlock {
        return SyntaxKind.MarkdownCodeBlock;
    }

    public get codeFence(): ICodeFence | undefined {
        return this._codeFence;
    }

    public set codeFence(value: ICodeFence | undefined) {
        const message: string | undefined =
            validateCodeFence(value, 'value') ||
            validateInfo(this._info, value, /*forCodeFence*/ true) ||
            validateLiteral(this._literal, value, /*forCodeFence*/ true);
        if (message) throw new Error(message);
        this._codeFence = value;
    }

    public get info(): string {
        return this._info || '';
    }

    public set info(value: string) {
        const message: string | undefined = validateInfo(value, this._codeFence, /*forCodeFence*/ false);
        if (message) throw new Error(message);
        this._info = value;
    }

    public get literal(): string {
        return this._literal || '';
    }

    public set literal(value: string) {
        const message: string | undefined = validateLiteral(value, this._codeFence, /*forCodeFence*/ false);
        if (message) throw new Error(message);
        this._literal = value;
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
