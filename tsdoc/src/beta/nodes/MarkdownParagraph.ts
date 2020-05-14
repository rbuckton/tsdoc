import { SyntaxKind } from "./SyntaxKind";
import { Block, IBlockParameters } from "./Block";
import { ContentUtils } from "../utils/ContentUtils";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { MarkdownParagraphSyntax } from "../syntax/commonmark/block/MarkdownParagraphSyntax";
import { InlineContainerMixin, IInlineContainerParameters } from "./mixins/InlineContainerMixin";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { BlockSiblingMixin } from "./mixins/BlockSiblingMixin";

export interface IMarkdownParagraphParameters extends IBlockParameters, IInlineContainerParameters {
}

export class MarkdownParagraph extends mixin(Block, [
    BlockChildMixin,
    BlockSiblingMixin,
    InlineContainerMixin,
]) {
    public constructor(parameters?: IMarkdownParagraphParameters) {
        super(parameters);
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownParagraph {
        return SyntaxKind.MarkdownParagraph;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<MarkdownParagraph> {
        return MarkdownParagraphSyntax;
    }
}