import { SyntaxKind } from "./SyntaxKind";
import { ListBase, IListBaseParameters } from "./ListBase";
import { Node } from "./Node";
import { GfmTaskListItem } from "./GfmTaskListItem";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { GfmTaskListSyntax } from "../syntax/gfm/block/GfmTaskListSyntax";
import { ListItemBase } from "./ListItemBase";

export interface IGfmTaskListParameters extends IListBaseParameters {
}

export class GfmTaskList extends ListBase {
    public constructor(parameters?: IGfmTaskListParameters) {
        super(parameters);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.GfmTaskList {
        return SyntaxKind.GfmTaskList;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<GfmTaskList> {
        return GfmTaskListSyntax;
    }

    /**
     * Gets the first child of this node, if that child is a {@link GfmTaskListItem}.
     */
    public get firstChildGfmTaskListItem(): GfmTaskListItem | undefined {
        const firstChild: ListItemBase | undefined = this.firstChildListItem;
        return firstChild && firstChild.kind === SyntaxKind.GfmTaskListItem ? firstChild as GfmTaskListItem : undefined;
    }

    /**
     * Gets the last child of this node, if that child is a {@link GfmTaskListItem}.
     */
    public get lastChildGfmTaskListItem(): GfmTaskListItem | undefined {
        const lastChild: ListItemBase | undefined = this.lastChildListItem;
        return lastChild && lastChild.kind === SyntaxKind.GfmTaskListItem ? lastChild as GfmTaskListItem : undefined;
    }

    /** @override */
    public canHaveChild(node: Node): boolean {
        return node.kind === SyntaxKind.GfmTaskListItem;
    }
}
