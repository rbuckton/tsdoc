import { SyntaxKind } from "./SyntaxKind";
import { Block, IBlockParameters } from "./Block";
import { ContentUtils } from "../utils/ContentUtils";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { MarkdownBlockQuoteSyntax } from "../syntax/commonmark/block/MarkdownBlockQuoteSyntax";
import { BlockContainerMixin, IBlockContainerParameters } from "./mixins/BlockContainerMixin";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { BlockSiblingMixin } from "./mixins/BlockSiblingMixin";

export interface IMarkdownBlockQuoteParameters extends IBlockParameters, IBlockContainerParameters {
}

export class MarkdownBlockQuote extends mixin(Block, [
    BlockChildMixin,
    BlockSiblingMixin,
    BlockContainerMixin
]) {
    public constructor(parameters?: IMarkdownBlockQuoteParameters) {
        super(parameters);
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownBlockQuote {
        return SyntaxKind.MarkdownBlockQuote;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<MarkdownBlockQuote> {
        return MarkdownBlockQuoteSyntax;
    }
}
