import { SyntaxKind } from "./SyntaxKind";
import { Block, IBlockParameters } from "./Block";
import { StringUtils } from "../utils/StringUtils";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { MarkdownCodeBlockSyntax } from "../syntax/commonmark/block/MarkdownCodeBlockSyntax";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { BlockSiblingMixin } from "./mixins/BlockSiblingMixin";

export interface ICodeFence {
    readonly fenceChar: '`' | '~';
    readonly fenceLength: number;
    readonly fenceOffset: number;
}

export interface IMarkdownCodeBlockParameters extends IBlockParameters {
    codeFence?: ICodeFence;
    info?: string;
    literal?: string;
}

function validateCodeFence(codeFence: ICodeFence | undefined, paramName: string): string | undefined {
    if (codeFence) {
        if (codeFence.fenceChar !== '`' && codeFence.fenceChar !== '~') {
            return `Argument out of range: ${paramName}.token.`;
        }
        if (codeFence.fenceOffset < 0 || codeFence.fenceOffset >= 4) {
            return `Argument out of range: ${paramName}.fenceOffset.`;
        }
        if (codeFence.fenceLength < 3) {
            return `Argument out of range: ${paramName}.length.`;
        }
    }
    return undefined;
}

function validateInfo(info: string | undefined, codeFence: ICodeFence | undefined, forCodeFence: boolean): string | undefined {
    if (info &&
        codeFence &&
        codeFence.fenceChar === '`' &&
        info.indexOf('`') >= 0) {
        return forCodeFence ?
            'Cannot specify a backtick (\'`\') code fence if the info string contains a backtick.' :
            'The info string of a code block with a backtick (\'`\') code fence cannot include a backtick.';
    }
    return undefined;
}

function validateLiteral(literal: string | undefined, codeFence: ICodeFence | undefined, forCodeFence: boolean): string | undefined {
    if (literal && codeFence) {
        const codeFenceToken: string = StringUtils.repeat(codeFence.fenceChar, codeFence.fenceLength);
        const codeFenceRegExp: RegExp = new RegExp(`^\\s{0,3}${codeFenceToken}\\s*$`, 'm');
        if (codeFenceRegExp.test(literal)) {
            const codeFenceKind: string = codeFence.fenceChar === '`' ? 'backtick (\'`\')' : 'tilde (\'~\')';
            return forCodeFence ?
                `Cannot specify a ${codeFenceKind} code fence if the literal of the code block includes a line containing only '${codeFenceToken}' indented less than 4 spaces.` :
                `The literal string of a code block with a ${codeFenceKind} code fence may not include a line containing only '${codeFenceToken}' indented less than 4 spaces.`;
        }
    }
    return undefined;
}

export class MarkdownCodeBlock extends mixin(Block, [
    BlockChildMixin,
    BlockSiblingMixin,
]) {
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

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownCodeBlock {
        return SyntaxKind.MarkdownCodeBlock;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<MarkdownCodeBlock> {
        return MarkdownCodeBlockSyntax;
    }

    /**
     * Gets or sets the code fence for this block.
     */
    public get codeFence(): ICodeFence | undefined {
        return this._codeFence;
    }

    public set codeFence(value: ICodeFence | undefined) {
        const message: string | undefined =
            validateCodeFence(value, 'value') ||
            validateInfo(this._info, value, /*forCodeFence*/ true) ||
            validateLiteral(this._literal, value, /*forCodeFence*/ true);
        if (message) throw new Error(message);
        if (this._codeFence !== value) {
            this.beforeChange();
            this._codeFence = value;
            this.afterChange();
        }
    }

    /**
     * Gets or sets the info string for this block.
     */
    public get info(): string {
        return this._info || '';
    }

    public set info(value: string) {
        const message: string | undefined = validateInfo(value, this._codeFence, /*forCodeFence*/ false);
        if (message) throw new Error(message);
        if (this._info !== value) {
            this.beforeChange();
            this._info = value;
            this.afterChange();
        }
    }

    /**
     * Gets or sets the literal text for this block.
     */
    public get literal(): string {
        return this._literal || '';
    }

    public set literal(value: string) {
        const message: string | undefined = validateLiteral(value, this._codeFence, /*forCodeFence*/ false);
        if (message) throw new Error(message);
        if (this._literal !== value) {
            this.beforeChange();
            this._literal = value;
            this.afterChange();
        }
    }
}
