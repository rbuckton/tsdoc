import { Block, IBlockParameters } from "./Block";
import { ContentUtils } from "../utils/ContentUtils";
import { BlockContainerMixin, IBlockContainerParameters } from "./mixins/BlockContainerMixin";
import { mixin } from "../mixin";
import { ListChildMixin } from "./mixins/ListChildMixin";
import { ListItemSiblingMixin } from "./mixins/ListItemSiblingMixin";

export interface IListMarker {
    readonly markerOffset: number;
    readonly bullet: string;
    readonly tight: boolean;
    readonly padding: number;
}

export interface IListItemBaseParameters extends IBlockParameters, IBlockContainerParameters {
    listMarker: IListMarker;
}

export abstract class ListItemBase extends mixin(Block, [
    ListChildMixin,
    ListItemSiblingMixin,
    BlockContainerMixin,
]) {
    private _listMarker: IListMarker;

    public constructor(parameters: IListItemBaseParameters) {
        super(parameters);
        ContentUtils.appendContent(this, parameters && parameters.content);
        this._listMarker = parameters.listMarker;
    }

    /**
     * Gets or sets the list marker for this list item.
     */
    public get listMarker(): IListMarker {
        return this.getListMarker();
    }

    public set listMarker(value: IListMarker) {
        this.setListMarker(value);
    }

    /**
     * {@inheritDoc Node.isListItem()}
     * @override
     */
    public isListItem(): true {
        return true;
    }

    /**
     * Gets the list marker for this list item.
     */
    protected getListMarker(): IListMarker {
        return this._listMarker;
    }

    /**
     * When overridden in a derived class, sets the list marker for this list item.
     * @virtual
     */
    protected setListMarker(value: IListMarker): void {
        if (value !== this._listMarker) {
            this.beforeChange();
            this._listMarker = value;
            this.afterChange();
        }
    }
}