import { Content, IContentConstructor } from "../Content";
import { Node } from "../Node";
import { ListItemBase } from "../ListItemBase";

export interface IListItemContainerParameters {
    content?: ListItemBase | ReadonlyArray<ListItemBase>;
}

/**
 * Represents a {@link Node} that can contain {@link ListItemBase} nodes.
 */
export interface IListItemContainer {
    /**
     * @override
     */
    isListItemContainer(): true;
    /**
     * Gets the first child of this node, if that child is a {@link ListItemBase}.
     */
    readonly firstChildListItem: ListItemBase | undefined;
    /**
     * Gets the last child of this node, if that child is a {@link ListItemBase}.
     */
    readonly lastChildListItem: ListItemBase | undefined;
}

export function ListItemContainerMixin<TBase extends IContentConstructor>(baseClass: TBase): TBase & (new (...args: any[]) => IListItemContainer);
export function ListItemContainerMixin<TBase extends new (...args: any[]) => Content>(baseClass: TBase): TBase & (new (...args: any[]) => IListItemContainer) {
    abstract class ListItemContainer extends baseClass {
        isListItemContainer(): true {
            return true;
        }
        get firstChildListItem(): ListItemBase | undefined {
            const firstChild: Node | undefined = this.firstChild;
            return firstChild && firstChild.isListItem() ? firstChild : undefined;
        }
        get lastChildListItem(): ListItemBase | undefined {
            const lastChild: Node | undefined = this.lastChild;
            return lastChild && lastChild.isListItem() ? lastChild : undefined;
        }
        canHaveChild(child: Node): boolean {
            return child.isListItem()
                || super.canHaveChild(child);
        }
    }
    return ListItemContainer;
}
