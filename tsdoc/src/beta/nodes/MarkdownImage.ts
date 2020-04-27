import { SyntaxKind } from "./SyntaxKind";
import { LinkBase, ILinkBaseParameters } from "./LinkBase";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IMarkdownImageParameters extends ILinkBaseParameters {
}

export class MarkdownImage extends LinkBase {
    public constructor(parameters: IMarkdownImageParameters = {}) {
        if (parameters.destination !== undefined && parameters.label !== undefined) {
            throw new Error('An image cannot specify both a destination and a label');
        }
        if (parameters.title !== undefined && parameters.label !== undefined) {
            throw new Error('An image cannot specify both a title and a label');
        }
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