import { SyntaxKind } from "./SyntaxKind";
import { Inline, IInlineParameters } from "./Inline";
import { ContentUtils } from "../utils/ContentUtils";
import { IInlineSyntax } from "../syntax/IInlineSyntax";
import { MarkdownEmphasisSyntax } from "../syntax/commonmark/inline/MarkdownEmphasisSyntax";
import { InlineContainerMixin, IInlineContainerParameters } from "./mixins/InlineContainerMixin";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { InlineChildMixin } from "./mixins/InlineChildMixin";
import { InlineSiblingMixin } from "./mixins/InlineSiblingMixin";

export interface IMarkdownStrongSpanParameters extends IInlineParameters, IInlineContainerParameters {
    style?: 'asterisk' | 'underscore';
}

export class MarkdownStrongSpan extends mixin(Inline, [
    BlockChildMixin,
    InlineChildMixin,
    InlineSiblingMixin,
    InlineContainerMixin,
]) {
    private _style: 'asterisk' | 'underscore' | undefined;

    public constructor(parameters?: IMarkdownStrongSpanParameters) {
        super(parameters);
        this._style = parameters && parameters.style;
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownStrongSpan {
        return SyntaxKind.MarkdownStrongSpan;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IInlineSyntax {
        return MarkdownEmphasisSyntax;
    }

    /**
     * Gets or sets the TSDoc/markdown style for the node.
     */
    public get style(): 'asterisk' | 'underscore' {
        return this._style || 'asterisk';
    }

    public set style(value: 'asterisk' | 'underscore') {
        value = value.toLowerCase() as 'asterisk' | 'underscore';
        if (value !== 'asterisk' && value !== 'underscore') throw new RangeError('Argument out of range: value');
        if (this._style !== value) {
            this.beforeChange();
            this._style = value;
            this.afterChange();
        }
    }

    /** @override */
    public isInlineContainer(): true {
        return true;
    }
}
