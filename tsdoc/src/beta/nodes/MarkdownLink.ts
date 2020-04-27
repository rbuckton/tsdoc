import { SyntaxKind } from "./SyntaxKind";
import { LinkBase, ILinkBaseParameters } from "./LinkBase";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IMarkdownLinkParameters extends ILinkBaseParameters {
}

export class MarkdownLink extends LinkBase {
    public constructor(parameters: IMarkdownLinkParameters = {}) {
        if (parameters.destination !== undefined && parameters.label !== undefined) {
            throw new Error('A link cannot specify both a destination and a label');
        }
        if (parameters.title !== undefined && parameters.label !== undefined) {
            throw new Error('A link cannot specify both a title and a label');
        }
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
