import { SyntaxKind } from "./SyntaxKind";
import { SyntaxElement, ISyntaxParameters } from "./SyntaxElement";
import { ISyntaxElementSyntax } from "../syntax/ISyntaxElementSyntax";
import { MarkdownLinkTitleSyntax } from "../syntax/commonmark/elements/MarkdownLinkTitleSyntax";

export interface IMarkdownLinkTitleParameters extends ISyntaxParameters {
    text?: string;
    quoteStyle?: MarkdownLinkTitleQuoteStyle;
}

export enum MarkdownLinkTitleQuoteStyle {
    DoubleQuote,
    SingleQuote,
    Parenthesized
}

export class MarkdownLinkTitle extends SyntaxElement {
    private _text: string | undefined;
    private _quoteStyle: MarkdownLinkTitleQuoteStyle | undefined;

    public constructor(parameters?: IMarkdownLinkTitleParameters) {
        super(parameters);
        this._text = parameters && parameters.text;
        this._quoteStyle = parameters && parameters.quoteStyle;
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownLinkTitle {
        return SyntaxKind.MarkdownLinkTitle;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): ISyntaxElementSyntax<MarkdownLinkTitle> {
        return MarkdownLinkTitleSyntax;
    }

    /**
     * Gets or sets the text of the title.
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

    /**
     * Gets or sets the TSDoc/markdown style for the title.
     */
    public get quoteStyle(): MarkdownLinkTitleQuoteStyle {
        return this._quoteStyle || MarkdownLinkTitleQuoteStyle.DoubleQuote;
    }

    public set quoteStyle(value: MarkdownLinkTitleQuoteStyle) {
        switch (value) {
            case MarkdownLinkTitleQuoteStyle.DoubleQuote:
            case MarkdownLinkTitleQuoteStyle.SingleQuote:
            case MarkdownLinkTitleQuoteStyle.Parenthesized:
                break;
            default:
                throw new RangeError("Argument out of range: value");
        }
        if (this.quoteStyle !== value) {
            this.beforeChange();
            this._quoteStyle = value;
            this.afterChange();
        }
    }
}

