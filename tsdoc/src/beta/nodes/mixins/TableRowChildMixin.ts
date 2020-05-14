import { Content } from "../Content";
import { TableRowBase } from "../TableRowBase";
import { Node, INodeConstructor } from "../Node";

/**
 * Represents a {@link Node} that can be the child of a {@link TableRowBase}.
 */
export interface ITableRowChild {
    /**
     * Gets the parent node of this node if that parent is a {@link TableRowBase}.
     */
    readonly parentTableRow: TableRowBase | undefined;
}

export function TableRowChildMixin<TBase extends INodeConstructor>(baseClass: TBase): TBase & (new (...args: any[]) => ITableRowChild);
export function TableRowChildMixin<TBase extends new (...args: any[]) => Content>(baseClass: TBase): TBase & (new (...args: any[]) => ITableRowChild) {
    abstract class TableRowChild extends baseClass {
        get parentTableRow(): TableRowBase | undefined {
            const parent: Node | undefined = this.parent;
            return parent && parent.isTableRow() ? parent : undefined;
        }
        canHaveParent(parent: Node): boolean {
            return parent.isTableRow();
        }
    }
    return TableRowChild;
}
