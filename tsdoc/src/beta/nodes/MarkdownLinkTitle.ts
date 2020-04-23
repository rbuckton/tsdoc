import { SyntaxKind } from "./SyntaxKind";
import { Syntax, ISyntaxParameters } from "./Syntax";

export interface IMarkdownLinkTitleParameters extends ISyntaxParameters {
    text?: string;
    quoteStyle?: MarkdownLinkTitleQuoteStyle;
}

export enum MarkdownLinkTitleQuoteStyle {
    DoubleQuote,
    SingleQuote,
    Parenthesized
}

export class MarkdownLinkTitle extends Syntax {
    private _text: string | undefined;
    private _quoteStyle: MarkdownLinkTitleQuoteStyle | undefined;

    public constructor(parameters?: IMarkdownLinkTitleParameters) {
        super(parameters);
        this._text = parameters && parameters.text;
        this._quoteStyle = parameters && parameters.quoteStyle;
    }

    public get kind(): SyntaxKind.MarkdownLinkTitle {
        return SyntaxKind.MarkdownLinkTitle;
    }

    public get text(): string {
        return this._text || "";
    }

    public set text(value: string) {
        if (this.text !== value) {
            this.beforeChange();
            this._text = value;
            this.afterChange();
        }
    }

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

