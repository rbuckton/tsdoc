import { SyntaxKind } from "./SyntaxKind";
import { ListBase, IListBaseParameters } from "./ListBase";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { Node } from "./Node";
import { MarkdownListItem } from "./MarkdownListItem";

export interface IMarkdownListParameters extends IListBaseParameters {
}

export class MarkdownList extends ListBase {
    public constructor(parameters?: IMarkdownListParameters) {
        super(parameters);
    }

    public get kind(): SyntaxKind.MarkdownList {
        return SyntaxKind.MarkdownList;
    }

    /**
     * Gets the first child of this node, if that child is a `MarkdownListItem`.
     */
    public get firstChildMarkdownListItem(): MarkdownListItem | undefined {
        return this.firstChild instanceof MarkdownListItem ? this.firstChild : undefined;
    }

    /**
     * Gets the last child of this node, if that child is a `ListItemBase`.
     */
    public get lastChildMarkdownListItem(): MarkdownListItem | undefined {
        return this.lastChild instanceof MarkdownListItem ? this.lastChild : undefined;
    }

    /** @override */
    public canHaveChild(node: Node): boolean {
        return node instanceof MarkdownListItem;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        this.printChildren(printer);
    }
}
