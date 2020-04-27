import { Block, IBlockParameters } from "./Block";
import { ListItemBase, IListItemContainer, IListItemContainerParameters } from "./ListItemBase";
import { ContentUtils } from "./ContentUtils";

export interface IListBaseParameters extends IBlockParameters, IListItemContainerParameters {
}

export abstract class ListBase extends Block implements IListItemContainer {
    public constructor(parameters?: IListBaseParameters) {
        super(parameters);
        ContentUtils.appendContent(this, parameters && parameters.content);
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

    /** @override */
    public isList(): true {
        return true;
    }

    /** @override */
    public isListItemContainer(): true {
        return true;
    }
}
