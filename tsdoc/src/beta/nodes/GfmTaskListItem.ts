import { SyntaxKind } from "./SyntaxKind";
import { ListItemBase, IListItemBaseParameters, IListMarker } from "./ListItemBase";
import { Node } from "./Node";
import { GfmTaskList } from "./GfmTaskList";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { GfmTaskListItemSyntax } from "../syntax/gfm/block/GfmTaskListItemSyntax";
import { ListBase } from "./ListBase";

export interface IGfmTaskListMarker extends IListMarker {
    readonly task: true;
    readonly bullet: '*' | '+' | '-';
    readonly checked: boolean;
}

export interface IGfmTaskListItemParameters extends IListItemBaseParameters {
    listMarker: IGfmTaskListMarker;
}

export class GfmTaskListItem extends ListItemBase {
    public constructor(parameters: IGfmTaskListItemParameters) {
        super(parameters);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.GfmTaskListItem {
        return SyntaxKind.GfmTaskListItem;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<GfmTaskListItem> {
        return GfmTaskListItemSyntax;
    }

    /**
     * {@inheritDoc ListItemBase.listMarker}
     * @override
     */
    public get listMarker(): IGfmTaskListMarker {
        return this.getListMarker() as IGfmTaskListMarker;
    }

    /**
     * {@inheritDoc ListItemBase.listMarker}
     * @override
     */
    public set listMarker(value: IGfmTaskListMarker) {
        this.setListMarker(value);
    }

    /**
     * Gets the parent of this node, if that parent is a {@link GfmTaskList}.
     */
    public get parentGfmTaskList(): GfmTaskList | undefined {
        const parent: ListBase | undefined = this.parentList;
        return parent && parent.kind === SyntaxKind.GfmTaskList ? parent as GfmTaskList : undefined;
    }

    /**
     * Gets the previous sibling of this node, if that sibling is a {@link GfmTaskListItem}.
     */
    public get previousSiblingGfmTaskListItem(): GfmTaskListItem | undefined {
        const previousSibling: ListItemBase | undefined = this.previousSiblingListItem;
        return previousSibling && previousSibling.kind === SyntaxKind.GfmTaskListItem ? previousSibling as GfmTaskListItem : undefined;
    }

    /**
     * Gets the next sibling of this node, if that sibling is a {@link GfmTaskListItem}.
     */
    public get nextSiblingGfmTaskListItem(): GfmTaskListItem | undefined {
        const nextSibling: ListItemBase | undefined = this.nextSiblingListItem;
        return nextSibling && nextSibling.kind === SyntaxKind.GfmTaskListItem ? nextSibling as GfmTaskListItem : undefined;
    }

    /**
     * {@inheritDoc Node.canHaveParent()}
     * @override
     */
    public canHaveParent(node: Node): boolean {
        return node.kind === SyntaxKind.GfmTaskList;
    }

    /**
     * {@inheritDoc ListItemBase.setListMarker()}
     * @override
     */
    protected setListMarker(value: IListMarker): void {
        super.setListMarker(value);
    }
}