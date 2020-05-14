import { ListBase } from "../ListBase";
import { Node, INodeConstructor } from "../Node";

/**
 * Represents a {@link Node} that can be the child of a {@link ListBase}.
 */
export interface IListChild {
    /**
     * Gets the parent node of this node if that parent is a {@link ListBase}.
     */
    readonly parentList: ListBase | undefined;
}

export function ListChildMixin<TBase extends INodeConstructor>(baseClass: TBase): TBase & (new (...args: any[]) => IListChild);
export function ListChildMixin<TBase extends new (...args: any[]) => Node>(baseClass: TBase): TBase & (new (...args: any[]) => IListChild) {
    abstract class ListChild extends baseClass {
        get parentList(): ListBase | undefined {
            const parent: Node | undefined = this.parent;
            return parent && parent.isList() ? parent : undefined;
        }
        canHaveParent(parent: Node): boolean {
            return parent.isList()
                || super.canHaveParent(parent);
        }
    }
    return ListChild;
}
