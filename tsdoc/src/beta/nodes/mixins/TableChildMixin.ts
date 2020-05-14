import { TableBase } from "../TableBase";
import { Node, INodeConstructor } from "../Node";

/**
 * Represents a {@link Node} that can be the child of a {@link TableBase}.
 */
export interface ITableChild {
    /**
     * Gets the parent node of this node if that parent is a {@link TableBase}.
     */
    readonly parentTable: TableBase | undefined;
}

export function TableChildMixin<TBase extends INodeConstructor>(baseClass: TBase): TBase & (new (...args: any[]) => ITableChild);
export function TableChildMixin<TBase extends new (...args: any[]) => Node>(baseClass: TBase): TBase & (new (...args: any[]) => ITableChild) {
    abstract class TableChild extends baseClass {
        get parentTable(): TableBase | undefined {
            const parent: Node | undefined = this.parent;
            return parent && parent.isTable() ? parent : undefined;
        }
        canHaveParent(parent: Node): boolean {
            return parent.isTable();
        }
    }
    return TableChild;
}
