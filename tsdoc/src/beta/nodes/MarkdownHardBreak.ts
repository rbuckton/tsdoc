import { Inline, IInlineParameters } from "./Inline";
import { SyntaxKind } from "./SyntaxKind";
import { IInlineSyntax } from "../syntax/IInlineSyntax";
import { MarkdownLineBreakSyntax } from "../syntax/commonmark/inline/MarkdownLineBreakSyntax";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { InlineChildMixin } from "./mixins/InlineChildMixin";
import { InlineSiblingMixin } from "./mixins/InlineSiblingMixin";

export interface IMarkdownHardBreakParameters extends IInlineParameters {
    backslash?: boolean;
}

export class MarkdownHardBreak extends mixin(Inline, [
    BlockChildMixin,
    InlineChildMixin,
    InlineSiblingMixin,
]) {
    private _backslash: boolean | undefined;

    public constructor(parameters?: IMarkdownHardBreakParameters) {
        super(parameters);
        this._backslash = parameters && parameters.backslash;
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownHardBreak {
        return SyntaxKind.MarkdownHardBreak;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IInlineSyntax {
        return MarkdownLineBreakSyntax;
    }

    /**
     * Gets or sets the TSDoc/markdown style for the break.
     */
    public get backslash(): boolean {
        return this._backslash || false;
    }

    public set backslash(value: boolean) {
        if (this.backslash !== value) {
            this.beforeChange();
            this._backslash = value;
            this.afterChange();
        }
    }
}