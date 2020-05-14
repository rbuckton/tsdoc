import { Block, IBlockParameters } from "./Block";
import { SyntaxKind } from "./SyntaxKind";
import { ContentUtils } from "../utils/ContentUtils";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { MarkdownHeadingSyntax } from "../syntax/commonmark/block/MarkdownHeadingSyntax";
import { InlineContainerMixin, IInlineContainerParameters } from "./mixins/InlineContainerMixin";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { BlockSiblingMixin } from "./mixins/BlockSiblingMixin";

export interface IMarkdownHeadingParameters extends IBlockParameters, IInlineContainerParameters {
    style: 'atx' | 'setext';
    level: number;
}

export class MarkdownHeading extends mixin(Block, [
    BlockChildMixin,
    BlockSiblingMixin,
    InlineContainerMixin,
]) {
    private _style: 'atx' | 'setext' | undefined;
    private _level: number | undefined;

    public constructor(parameters?: IMarkdownHeadingParameters) {
        super(parameters);
        this._style = parameters && parameters.style;
        this._level = parameters && parameters.level;
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownHeading {
        return SyntaxKind.MarkdownHeading;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<MarkdownHeading> {
        return MarkdownHeadingSyntax;
    }

    /**
     * Gets or sets the TSDoc/markdown style for the heading.
     */
    public get style(): 'atx' | 'setext' {
        return this._style || 'atx';
    }

    public set style(value: 'atx' | 'setext') {
        value = value.toLowerCase() as 'atx' | 'setext';
        if (value !== 'atx' && value !== 'setext') throw new RangeError("Argument out of range: value");
        // TODO: If value is 'setext', 'level' must be either 1 or 2
        if (this.style !== value) {
            this.beforeChange();
            this._style = value;
            this.afterChange();
        }
    }

    /**
     * Gets or sets sets the heading level (1-6).
     */
    public get level(): number {
        return this._level || 1;
    }

    public set level(value: number) {
        if (value < 1 || value > 6 || (value >>> 0) !== value) {
            throw new RangeError("Argument out of range: value");
        }
        // TODO: if level is > 2, style cannot be setext.
        if (this.level !== value) {
            this.beforeChange();
            this._level = value;
            this.afterChange();
        }
    }
}
