import { Inline } from "./Inline";
import { SyntaxKind } from "./SyntaxKind";
import { INodeParameters } from "./Node";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IMarkdownHtmlInlineParameters extends INodeParameters {
    html?: string;
}

export class MarkdownHtmlInline extends Inline {
    private _html: string | undefined;

    public constructor(parameters?: IMarkdownHtmlInlineParameters) {
        super(parameters);
        this._html = parameters && parameters.html;
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownHtmlInline {
        return SyntaxKind.MarkdownHtmlInline;
    }

    public get html(): string {
        return this._html || "";
    }

    public set html(value: string) {
        if (this.html !== value) {
            this.beforeChange();
            this._html = value;
            this.afterChange();
        }
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.write(this.html);
    }
}