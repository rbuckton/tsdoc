import { SyntaxKind } from "./SyntaxKind";
import { LinkBase, ILinkBaseParameters } from "./LinkBase";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IMarkdownLinkParameters extends ILinkBaseParameters {
}

export class MarkdownLink extends LinkBase {
    public constructor(parameters?: IMarkdownLinkParameters) {
        super(parameters);
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownLink {
        return SyntaxKind.MarkdownLink;
    }

    /** @override */
    protected printLinkContent(printer: TSDocPrinter): void {
        printer.write('[');
        this.printChildren(printer);
        printer.write(']');
    }
}
