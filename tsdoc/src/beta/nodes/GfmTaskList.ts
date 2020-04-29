import { SyntaxKind } from "./SyntaxKind";
import { ListBase, IListBaseParameters } from "./ListBase";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { Node } from "./Node";
import { GfmTaskListItem } from "./GfmTaskListItem";

export interface IGfmTaskListParameters extends IListBaseParameters {
}

export class GfmTaskList extends ListBase {
    public constructor(parameters?: IGfmTaskListParameters) {
        super(parameters);
    }

    public get kind(): SyntaxKind.GfmTaskList {
        return SyntaxKind.GfmTaskList;
    }

    /**
     * Gets the first child of this node, if that child is a `GfmTaskListItem`.
     */
    public get firstChildGfmTaskListItem(): GfmTaskListItem | undefined {
        return this.firstChild instanceof GfmTaskListItem ? this.firstChild : undefined;
    }

    /**
     * Gets the last child of this node, if that child is a `ListItemBase`.
     */
    public get lastChildGfmTaskListItem(): GfmTaskListItem | undefined {
        return this.lastChild instanceof GfmTaskListItem ? this.lastChild : undefined;
    }

    /** @override */
    public canHaveChild(node: Node): boolean {
        return node instanceof GfmTaskListItem;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        this.printChildren(printer);
    }
}
