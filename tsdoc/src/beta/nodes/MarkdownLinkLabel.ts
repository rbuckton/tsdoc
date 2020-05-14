import { SyntaxKind } from "./SyntaxKind";
import { SyntaxElement, ISyntaxParameters } from "./SyntaxElement";
import { ISyntaxElementSyntax } from "../syntax/ISyntaxElementSyntax";
import { MarkdownLinkLabelSyntax } from "../syntax/commonmark/elements/MarkdownLinkLabelSyntax";

export interface IMarkdownLinkLabelParameters extends ISyntaxParameters {
    text?: string;
}

export class MarkdownLinkLabel extends SyntaxElement {
    private _text: string | undefined;

    public constructor(parameters?: IMarkdownLinkLabelParameters) {
        super(parameters);
        this._text = parameters && parameters.text;
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownLinkLabel {
        return SyntaxKind.MarkdownLinkLabel;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): ISyntaxElementSyntax<MarkdownLinkLabel> {
        return MarkdownLinkLabelSyntax;
    }

    /**
     * Gets or sets the text of the label.
     */
    public get text(): string {
        return this._text || '';
    }

    public set text(value: string) {
        if (this.text !== value) {
            this.beforeChange();
            this._text = value;
            this.afterChange();
        }
    }
}