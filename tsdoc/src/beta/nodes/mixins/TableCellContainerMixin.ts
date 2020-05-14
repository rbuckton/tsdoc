import { Content, IContentConstructor } from "../Content";
import { Node } from "../Node";
import { TableCellBase } from "../TableCellBase";

export interface ITableCellContainerParameters {
    content?: TableCellBase | ReadonlyArray<TableCellBase>;
}

/**
 * Represents a {@link Node} that can contain {@link TableCellBase} nodes.
 */
export interface ITableCellContainer {
    /**
     * @override
     */
    isTableCellContainer(): true;
    /**
     * Gets the first child of this node, if that child is a {@link TableCellBase}.
     */
    readonly firstChildTableCell: TableCellBase | undefined;
    /**
     * Gets the last child of this node, if that child is a {@link TableCellBase}.
     */
    readonly lastChildTableCell: TableCellBase | undefined;
}

export function TableCellContainerMixin<TBase extends IContentConstructor>(baseClass: TBase): TBase & (new (...args: any[]) => ITableCellContainer);
export function TableCellContainerMixin<TBase extends new (...args: any[]) => Content>(baseClass: TBase): TBase & (new (...args: any[]) => ITableCellContainer) {
    abstract class TableCellContainer extends baseClass {
        isTableCellContainer(): true {
            return true;
        }
        get firstChildTableCell(): TableCellBase | undefined {
            const firstChild: Node | undefined = this.firstChild;
            return firstChild && firstChild.isTableCell() ? firstChild : undefined;
        }
        get lastChildTableCell(): TableCellBase | undefined {
            const lastChild: Node | undefined = this.lastChild;
            return lastChild && lastChild.isTableCell() ? lastChild : undefined;
        }
        canHaveChild(child: Node): boolean {
            return child.isTableCell();
        }
    }
    return TableCellContainer;
}
