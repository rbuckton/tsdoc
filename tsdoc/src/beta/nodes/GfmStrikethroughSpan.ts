import { SyntaxKind } from "./SyntaxKind";
import { Inline, IInlineParameters } from "./Inline";
import { IInlineContainerParameters, InlineContainerMixin } from "./mixins/InlineContainerMixin";
import { ContentUtils } from "../utils/ContentUtils";
import { IInlineSyntax } from "../syntax/IInlineSyntax";
import { GfmStrikethroughSyntax } from "../syntax/gfm/inline/GfmStrikethroughSyntax";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { InlineChildMixin } from "./mixins/InlineChildMixin";
import { InlineSiblingMixin } from "./mixins/InlineSiblingMixin";

export interface IGfmStrikethroughSpanParameters extends IInlineParameters, IInlineContainerParameters {
}

export class GfmStrikethroughSpan extends mixin(Inline, [
    BlockChildMixin,
    InlineChildMixin,
    InlineSiblingMixin,
    InlineContainerMixin,
]) {
    public constructor(parameters?: IGfmStrikethroughSpanParameters) {
        super(parameters);
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.GfmStrikethroughSpan { 
        return SyntaxKind.GfmStrikethroughSpan;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IInlineSyntax {
        return GfmStrikethroughSyntax;
    }
}