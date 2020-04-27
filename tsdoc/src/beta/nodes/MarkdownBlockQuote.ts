import { SyntaxKind } from "./SyntaxKind";
import { Block, IBlockParameters, IBlockContainerParameters, IBlockContainer } from "./Block";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { ContentUtils } from "./ContentUtils";

export interface IMarkdownBlockQuoteParameters extends IBlockParameters, IBlockContainerParameters {
}

export class MarkdownBlockQuote extends Block implements IBlockContainer {
    public constructor(parameters?: IMarkdownBlockQuoteParameters) {
        super(parameters);
        ContentUtils.appendContent(this, parameters && parameters.content);
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
        printer.pushBlock({ linePrefix: '> ' });
        this.printChildren(printer);
        printer.popBlock();
    }
}
