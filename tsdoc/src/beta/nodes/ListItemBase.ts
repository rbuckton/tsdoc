import { Token } from "../parser/Token";
import { Block, IBlockParameters, IBlockContainer, IBlockContainerParameters } from "./Block";
import { ListBase } from "./ListBase";
import { ContentUtils } from "./ContentUtils";
import { Content } from "./Content";

export interface IOrderedListMarker {
    readonly markerOffset: number;
    readonly ordered: true;
    readonly bulletToken: Token.OrderedListItemBullet;
    readonly start: number;
    readonly tight: boolean;
    readonly padding: number;
}

export interface IUnorderedListMarker {
    readonly markerOffset: number;
    readonly ordered: false;
    readonly bulletToken: Token.UnorderedListItemBullet;
    readonly tight: boolean;
    readonly padding: number;
}

export type ListMarker =
    | IOrderedListMarker
    | IUnorderedListMarker
    ;

export interface IListItemBaseParameters extends IBlockParameters, IBlockContainerParameters {
    readonly listMarker: ListMarker;
}

export interface IListItemContainer extends Content {
    isListItemContainer(): true;
    readonly firstChildListItem: ListItemBase | undefined;
    readonly lastChildListItem: ListItemBase | undefined;
}

export interface IListItemContainerParameters {
    content?: ListItemBase | ReadonlyArray<ListItemBase>;
}

export abstract class ListItemBase extends Block implements IBlockContainer {
    private _listMarker: ListMarker;
    
    public constructor(parameters: IListItemBaseParameters) {
        super(parameters);
        ContentUtils.appendContent(this, parameters && parameters.content);
        this._listMarker = parameters.listMarker;
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
    public get listMarker(): ListMarker {
        return this._listMarker;
    }

    public set listMarker(value: ListMarker) {
        if (value !== this._listMarker) {
            this.beforeChange();
            this._listMarker = value;
            this.afterChange();
        }
    }

    /** @override */
    public isListItem(): true {
        return true;
    }

    /** @override */
    public isBlockContainer(): true {
        return true;
    }
}