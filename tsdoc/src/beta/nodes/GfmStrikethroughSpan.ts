import { SyntaxKind } from "./SyntaxKind";
import { Inline, IInlineParameters, IInlineContainer, IInlineContainerParameters } from "./Inline";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { ContentUtils } from "./ContentUtils";

export interface IGfmStrikethroughSpanParameters extends IInlineParameters, IInlineContainerParameters {
}

export class GfmStrikethroughSpan extends Inline implements IInlineContainer {
    public constructor(parameters?: IGfmStrikethroughSpanParameters) {
        super(parameters);
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /** @override */
    public get kind(): SyntaxKind.GfmStrikethroughSpan { 
        return SyntaxKind.GfmStrikethroughSpan;
    }

    /** @override */
    public isInlineContainer(): true {
        return true;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.write('~~');
        this.printChildren(printer);
        printer.write('~~');
    }
}