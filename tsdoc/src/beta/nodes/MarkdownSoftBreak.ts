import { Inline, IInlineParameters } from "./Inline";
import { SyntaxKind } from "./SyntaxKind";
import { IInlineSyntax } from "../syntax/IInlineSyntax";
import { MarkdownLineBreakSyntax } from "../syntax/commonmark/inline/MarkdownLineBreakSyntax";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { InlineChildMixin } from "./mixins/InlineChildMixin";
import { InlineSiblingMixin } from "./mixins/InlineSiblingMixin";

export interface IMarkdownSoftBreakParameters extends IInlineParameters {
}

export class MarkdownSoftBreak extends mixin(Inline, [
    BlockChildMixin,
    InlineChildMixin,
    InlineSiblingMixin,
]) {
    public constructor(parameters?: IMarkdownSoftBreakParameters) {
        super(parameters);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownSoftBreak {
        return SyntaxKind.MarkdownSoftBreak;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IInlineSyntax {
        return MarkdownLineBreakSyntax;
    }
}