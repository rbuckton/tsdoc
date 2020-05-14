import { Block, IBlockParameters } from "./Block";
import { ContentUtils } from "../utils/ContentUtils";
import { ListItemContainerMixin, IListItemContainerParameters } from "./mixins/ListItemContainerMixin";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { BlockSiblingMixin } from "./mixins/BlockSiblingMixin";

export interface IListBaseParameters extends IBlockParameters, IListItemContainerParameters {
}

export abstract class ListBase extends mixin(Block, [
    BlockChildMixin,
    BlockSiblingMixin,
    ListItemContainerMixin,
]) {
    public constructor(parameters?: IListBaseParameters) {
        super(parameters);
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /**
     * {@inheritDoc Node.isList()}
     * @override 
     */
    public isList(): true {
        return true;
    }
}
