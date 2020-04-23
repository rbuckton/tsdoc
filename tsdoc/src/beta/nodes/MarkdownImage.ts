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
    protected print(printer: TSDocPrinter): void {
        printer.write('![');
        this.printChildren(printer);
        printer.write(']');
        if (this.destinationSyntax) {
            printer.write('(');
            if (this.destinationSyntax.bracketed) {
                printer.write('<');
                printer.write(this.destinationSyntax.href);
                printer.write('>');
            } else {
                printer.write(this.destinationSyntax.href);
            }
            if (this.titleSyntax) {
                printer.write(' ');
                printer.write(this.titleSyntax.text);
            }
            printer.write(')');
        } else if (this.labelSyntax) {
            printer.write('[');
            printer.write(this.labelSyntax.text);
            printer.write(']');
        }
    }
}