import { Block, IBlockParameters } from "./Block";
import { ListBase, IListMarker } from "./ListBase";

export interface IListItemBaseParameters extends IBlockParameters {
}

export abstract class ListItemBase extends Block {
    public constructor(parameters?: IListItemBaseParameters) {
        super(parameters);
    }

    /**
     * Gets the parent of this node, if that parent is a `ListBase`.
     */
    public get parentList(): ListBase | undefined {
        return this.parent && this.parent.isList() ? this.parent : undefined;
    }

    /**
     * Gets the previous sibling of this node, if that sibling is a `ListItemBase`.
     */
    public get previousSiblingListItem(): ListItemBase | undefined {
        return this.previousSibling && this.previousSibling.isListItem() ? this.previousSibling : undefined;
    }

    /**
     * Gets the next sibling of this node, if that sibling is a `ListItemBase`.
     */
    public get nextSiblingListItem(): ListItemBase | undefined {
        return this.nextSibling && this.nextSibling.isListItem() ? this.nextSibling : undefined;
    }

    /**
     * Gets the list marker for this list item.
     */
    public abstract get listMarker(): IListMarker;

    /** @override */
    public isListItem(): true {
        return true;
    }

    /** @override */
    public isBlockContainer(): true {
        return true;
    }
}