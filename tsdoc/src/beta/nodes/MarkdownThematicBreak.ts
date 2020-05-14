import { INodeParameters } from "./Node";
import { Block } from "./Block";
import { SyntaxKind } from "./SyntaxKind";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { MarkdownThematicBreakSyntax } from "../syntax/commonmark/block/MarkdownThematicBreakSyntax";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { BlockSiblingMixin } from "./mixins/BlockSiblingMixin";

export interface IMarkdownThematicBreakParameters extends INodeParameters {
    style: '*' | '-' | '_';
}

export class MarkdownThematicBreak extends mixin(Block, [
    BlockChildMixin,
    BlockSiblingMixin,
]) {
    public readonly parent: Block | undefined;
    public readonly previousSibling: Block | undefined;
    public readonly nextSibling: Block | undefined;
    public readonly firstChild: undefined;
    public readonly lastChild: undefined;

    private _style: '*' | '-' | '_';

    public constructor(parameters: IMarkdownThematicBreakParameters) {
        super(parameters);
        this._style = parameters.style;
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownThematicBreak {
        return SyntaxKind.MarkdownThematicBreak;
    }
    
    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<MarkdownThematicBreak> {
        return MarkdownThematicBreakSyntax;
    }

    /**
     * Gets or sets the TSDoc/markdown style for the node.
     */
    public get style(): '*' | '-' | '_' {
        return this._style;
    }

    public set style(value: '*' | '-' | '_') {
        if (value !== '*' && value !== '-' && value !== '_') throw new RangeError('Argument out of range: value');
        if (this._style !== value) {
            this.beforeChange();
            this._style = value;
            this.afterChange();
        }
    }
}
