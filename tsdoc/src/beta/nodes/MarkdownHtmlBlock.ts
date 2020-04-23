import { SyntaxKind } from "./SyntaxKind";
import { INodeParameters } from "./Node";
import { Block } from "./Block";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IMarkdownHtmlBlockParameters extends INodeParameters {
    html?: string;
}

export class MarkdownHtmlBlock extends Block {
    private _literal: string | undefined;

    public constructor(parameters?: IMarkdownHtmlBlockParameters) {
        super(parameters);
        this._literal = parameters && parameters.html;
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownHtmlBlock {
        return SyntaxKind.MarkdownHtmlBlock;
    }

    public get literal(): string {
        return this._literal || '';
    }

    public set literal(value: string) {
        this._literal = value;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.write(this.literal);
        printer.writeln();
    }
}