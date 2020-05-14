import { Content, IContentConstructor } from "../Content";
import { ListItemBase } from "../ListItemBase";
import { Node } from "../Node";

export interface IListItemSibling {
    /**
     * Gets the previous sibling of this node if that sibling is a `ListItem`.
     */
    readonly previousSiblingListItem: ListItemBase | undefined;
    /**
     * Gets the next sibling of this node if that sibling is a `ListItem`.
     */
    readonly nextSiblingListItem: ListItemBase | undefined;
}

export function ListItemSiblingMixin<TBase extends IContentConstructor>(baseClass: TBase): TBase & (new (...args: any[]) => IListItemSibling);
export function ListItemSiblingMixin<TBase extends new (...args: any[]) => Content>(baseClass: TBase): TBase & (new (...args: any[]) => IListItemSibling) {
    abstract class ListItemSibling extends baseClass {
        get previousSiblingListItem(): ListItemBase | undefined {
            const previousSibling: Node | undefined = this.previousSibling;
            return previousSibling && previousSibling.isListItem() ? previousSibling : undefined;
        }
        get nextSiblingListItem(): ListItemBase | undefined {
            const nextSibling: Node | undefined = this.nextSibling;
            return nextSibling && nextSibling.isListItem() ? nextSibling : undefined;
        }
    }
    return ListItemSibling;
}
