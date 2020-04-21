import { SyntaxKind } from "./SyntaxKind";
import { Block, IBlockParameters } from "./Block";
import { TSDocPrinter } from "../TSDocPrinter";

export interface IMarkdownBlockQuoteParameters extends IBlockParameters {
}

export class MarkdownBlockQuote extends Block {
    public constructor(parameters?: IMarkdownBlockQuoteParameters) {
        super(parameters);
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownBlockQuote {
        return SyntaxKind.MarkdownBlockQuote;
    }

    /** @override */
    public isBlockContainer(): true {
        return true;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.pushBlock({
            linePrefix: '>'
        });
        this.printChildren(printer);
        printer.popBlock();
    }
}
