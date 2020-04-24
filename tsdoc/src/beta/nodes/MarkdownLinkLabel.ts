import { SyntaxKind } from "./SyntaxKind";
import { Syntax, ISyntaxParameters } from "./Syntax";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IMarkdownLinkLabelParameters extends ISyntaxParameters {
    text?: string;
}

export class MarkdownLinkLabel extends Syntax {
    private _text: string | undefined;

    public constructor(parameters?: IMarkdownLinkLabelParameters) {
        super(parameters);
        this._text = parameters && parameters.text;
    }

    public get kind(): SyntaxKind.MarkdownLinkLabel {
        return SyntaxKind.MarkdownLinkLabel;
    }

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

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.write('[');
        printer.write(this.text);
        printer.write(']');
    }
}