import { Inline } from "./Inline";
import { SyntaxKind } from "./SyntaxKind";
import { INodeParameters } from "./Node";
import { IInlineSyntax } from "../syntax/IInlineSyntax";
import { MarkdownCodeSpanSyntax } from "../syntax/commonmark/inline/MarkdownCodeSpanSyntax";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { InlineChildMixin } from "./mixins/InlineChildMixin";
import { InlineSiblingMixin } from "./mixins/InlineSiblingMixin";

export interface IMarkdownCodeSpanParameters extends INodeParameters {
    backtickCount?: number;
    text?: string;
}

export class MarkdownCodeSpan extends mixin(Inline, [
    BlockChildMixin,
    InlineChildMixin,
    InlineSiblingMixin,
]) {
    private _backtickCount: number | undefined;
    private _text: string | undefined;

    public constructor(parameters?: IMarkdownCodeSpanParameters) {
        super(parameters);
        this._backtickCount = parameters && parameters.backtickCount;
        this._text = parameters && parameters.text;
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownCodeSpan {
        return SyntaxKind.MarkdownCodeSpan;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IInlineSyntax {
        return MarkdownCodeSpanSyntax;
    }

    /**
     * Gets or sets the number of backticks for this span.
     */
    public get backtickCount(): number {
        // TODO: When undefined, derive an adequate number of backticks that do not conflict with `text`.
        return this._backtickCount || 1;
    }

    public set backtickCount(value: number) {
        if (value < 1) throw new RangeError('Argument out of range: value');
        // TODO: verify that a backtick string with the same number of backticks is not present in `text`.
        if (this.backtickCount !== value) {
            this.beforeChange();
            this._backtickCount = value;
            this.afterChange();
        }
    }

    /**
     * Gets or sets the text of the code span.
     */
    public get text(): string {
        return this._text || '';
    }

    public set text(value: string) {
        // TODO: verify that value does not contain a backtick string with the same number of backticks as `backtickCount`.
        if (this.text !== value) {
            this.beforeChange();
            this._text = value;
            this.afterChange();
        }
    }
}