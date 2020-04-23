import { Block, IBlockParameters } from "./Block";
import { ListItemBase } from "./ListItemBase";

export interface IListMarker {
    readonly markerOffset: number;
    readonly tight: boolean;
    readonly padding: number;
}

export interface IListBaseParameters extends IBlockParameters {
}

export abstract class ListBase extends Block {
    public constructor(parameters?: IListBaseParameters) {
        super(parameters);
    }

    /**
     * Gets the first child of this node, if that child is a `ListItemBase`.
     */
    public get firstChildListItem(): ListItemBase | undefined {
        return this.firstChild && this.firstChild.isListItem() ? this.firstChild : undefined;
    }

    /**
     * Gets the last child of this node, if that child is a `ListItemBase`.
     */
    public get lastChildListItem(): ListItemBase | undefined {
        return this.lastChild && this.lastChild.isListItem() ? this.lastChild : undefined;
    }

    /**
     * Gets the list marker for this list.
     */
    public abstract get listMarker(): IListMarker;

    /** @override */
    public isList(): true {
        return true;
    }

    /** @override */
    public isListItemContainer(): true {
        return true;
    }
}
