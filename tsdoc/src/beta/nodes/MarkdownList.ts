import { SyntaxKind } from "./SyntaxKind";
import { ListBase, IListBaseParameters } from "./ListBase";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IMarkdownListParameters extends IListBaseParameters {
}

export class MarkdownList extends ListBase {
    public constructor(parameters?: IMarkdownListParameters) {
        super(parameters);
    }

    public get kind(): SyntaxKind.MarkdownList {
        return SyntaxKind.MarkdownList;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        this.printChildren(printer);
    }
}
