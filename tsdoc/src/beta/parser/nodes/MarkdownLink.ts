import { SyntaxKind } from "./SyntaxKind";
import { LinkBase, ILinkBaseParameters } from "./LinkBase";
import { TSDocPrinter } from "../TSDocPrinter";

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
    protected print(printer: TSDocPrinter): void {
        printer.write('[');
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
