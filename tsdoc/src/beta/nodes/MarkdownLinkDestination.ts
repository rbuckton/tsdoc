import { SyntaxKind } from "./SyntaxKind";
import { Syntax, ISyntaxParameters } from "./Syntax";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IMarkdownLinkDestinationParameters extends ISyntaxParameters {
    text?: string;
    bracketed?: boolean;
}

export class MarkdownLinkDestination extends Syntax {
    private _text: string | undefined;
    private _bracketed: boolean | undefined;

    public constructor(parameters?: IMarkdownLinkDestinationParameters) {
        super(parameters);
        this._text = parameters && parameters.text;
        this._bracketed = parameters && parameters.bracketed;
    }

    public get kind(): SyntaxKind.MarkdownLinkDestination {
        return SyntaxKind.MarkdownLinkDestination;
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

    public get bracketed(): boolean {
        return this._bracketed || false;
    }

    public set bracketed(value: boolean) {
        if (this.bracketed !== value) {
            this.beforeChange();
            this._bracketed = value;
            this.afterChange();
        }
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.write(this.text);
    }
}
