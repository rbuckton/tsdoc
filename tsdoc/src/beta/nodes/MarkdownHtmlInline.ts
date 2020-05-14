import { Inline } from "./Inline";
import { SyntaxKind } from "./SyntaxKind";
import { INodeParameters } from "./Node";
import { IInlineSyntax } from "../syntax/IInlineSyntax";
import { MarkdownHtmlSyntax } from "../syntax/commonmark/block/MarkdownHtmlSyntax";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { InlineChildMixin } from "./mixins/InlineChildMixin";
import { InlineSiblingMixin } from "./mixins/InlineSiblingMixin";

export interface IMarkdownHtmlInlineParameters extends INodeParameters {
    html?: string;
}

export class MarkdownHtmlInline extends mixin(Inline, [
    BlockChildMixin,
    InlineChildMixin,
    InlineSiblingMixin,
]) {
    private _html: string | undefined;

    public constructor(parameters?: IMarkdownHtmlInlineParameters) {
        super(parameters);
        this._html = parameters && parameters.html;
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownHtmlInline {
        return SyntaxKind.MarkdownHtmlInline;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IInlineSyntax {
        return MarkdownHtmlSyntax;
    }

    /**
     * Gets or sets the literal text of the HTML inline.
     */
    public get literal(): string {
        return this._html || "";
    }

    public set literal(value: string) {
        if (this.literal !== value) {
            this.beforeChange();
            this._html = value;
            this.afterChange();
        }
    }
}