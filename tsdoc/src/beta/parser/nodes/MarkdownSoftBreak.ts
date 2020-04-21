import { Inline, IInlineParameters } from "./Inline";
import { SyntaxKind } from "./SyntaxKind";
import { TSDocPrinter } from "../TSDocPrinter";

export interface IMarkdownSoftBreakParameters extends IInlineParameters {
}

export class MarkdownSoftBreak extends Inline {
    public constructor(parameters?: IMarkdownSoftBreakParameters) {
        super(parameters);
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownSoftBreak {
        return SyntaxKind.MarkdownSoftBreak;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.writeln();
    }
}