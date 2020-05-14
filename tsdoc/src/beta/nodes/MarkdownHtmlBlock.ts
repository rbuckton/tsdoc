import { SyntaxKind } from "./SyntaxKind";
import { INodeParameters } from "./Node";
import { Block } from "./Block";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { MarkdownHtmlSyntax } from "../syntax/commonmark/block/MarkdownHtmlSyntax";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { BlockSiblingMixin } from "./mixins/BlockSiblingMixin";

export interface IMarkdownHtmlBlockParameters extends INodeParameters {
    html?: string;
}

export class MarkdownHtmlBlock extends mixin(Block, [
    BlockChildMixin,
    BlockSiblingMixin,
]) {
    private _literal: string | undefined;

    public constructor(parameters?: IMarkdownHtmlBlockParameters) {
        super(parameters);
        this._literal = parameters && parameters.html;
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownHtmlBlock {
        return SyntaxKind.MarkdownHtmlBlock;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<MarkdownHtmlBlock> {
        return MarkdownHtmlSyntax;
    }

    /**
     * Gets or sets the literal text of the HTML block.
     */
    public get literal(): string {
        return this._literal || '';
    }

    public set literal(value: string) {
        this._literal = value;
    }
}