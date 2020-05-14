import { Content, IContentConstructor } from "../Content";
import { Node } from "../Node";
import { TableRowBase } from "../TableRowBase";

export interface ITableRowContainerParameters {
    content?: TableRowBase | ReadonlyArray<TableRowBase>;
}

/**
 * Represents a {@link Node} that can contain {@link TableCellBase} nodes.
 */
export interface ITableRowContainer {
    /**
     * @override
     */
    isTableRowContainer(): true;
    /**
     * Gets the first child of this node, if that child is a {@link TableCellBase}.
     */
    readonly firstChildTableRow: TableRowBase | undefined;
    /**
     * Gets the last child of this node, if that child is a {@link TableCellBase}.
     */
    readonly lastChildTableRow: TableRowBase | undefined;
}

export function TableRowContainerMixin<TBase extends IContentConstructor>(baseClass: TBase): TBase & (new (...args: any[]) => ITableRowContainer);
export function TableRowContainerMixin<TBase extends new (...args: any[]) => Content>(baseClass: TBase): TBase & (new (...args: any[]) => ITableRowContainer) {
    abstract class TableRowContainer extends baseClass {
        isTableRowContainer(): true {
            return true;
        }
        get firstChildTableRow(): TableRowBase | undefined {
            const firstChild: Node | undefined = this.firstChild;
            return firstChild && firstChild.isTableRow() ? firstChild : undefined;
        }
        get lastChildTableRow(): TableRowBase | undefined {
            const lastChild: Node | undefined = this.lastChild;
            return lastChild && lastChild.isTableRow() ? lastChild : undefined;
        }
        canHaveChild(child: Node): boolean {
            return child.isTableRow()
                || super.canHaveChild(child);
        }
    }
    return TableRowContainer;
}
