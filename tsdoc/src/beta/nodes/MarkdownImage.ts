import { SyntaxKind } from "./SyntaxKind";
import { LinkBase, ILinkBaseParameters } from "./LinkBase";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IMarkdownImageParameters extends ILinkBaseParameters {
}

export class MarkdownImage extends LinkBase {
    public constructor(parameters: IMarkdownImageParameters) {
        super(parameters);
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownImage {
        return SyntaxKind.MarkdownImage;
    }

    /** @override */
    protected printLinkContent(printer: TSDocPrinter): void {
        printer.write('![');
        this.printChildren(printer);
        printer.write(']');
    }
}