import { SyntaxKind } from "./SyntaxKind";
import { Block, IBlockParameters } from "./Block";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IMarkdownParagraphParameters extends IBlockParameters {
}

export class MarkdownParagraph extends Block {
    public constructor(parameters?: IMarkdownParagraphParameters) {
        super(parameters);
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownParagraph {
        return SyntaxKind.MarkdownParagraph;
    }

    /** @override */
    public isInlineContainer(): true {
        return true;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        this.printChildren(printer);
        printer.writeln();
    }
}