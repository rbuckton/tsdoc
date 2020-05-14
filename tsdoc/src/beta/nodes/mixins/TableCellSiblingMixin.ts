import { Content, IContentConstructor } from "../Content";
import { TableCellBase } from "../TableCellBase";
import { Node } from "../Node";

export interface ITableCellSibling {
    /**
     * Gets the previous sibling of this node if that sibling is a {@link TableCellBase}.
     */
    readonly previousSiblingTableCell: TableCellBase | undefined;
    /**
     * Gets the next sibling of this node if that sibling is a {@link TableCellBase}.
     */
    readonly nextSiblingTableCell: TableCellBase | undefined;
}

export function TableCellSiblingMixin<TBase extends IContentConstructor>(baseClass: TBase): TBase & (new (...args: any[]) => ITableCellSibling);
export function TableCellSiblingMixin<TBase extends new (...args: any[]) => Content>(baseClass: TBase): TBase & (new (...args: any[]) => ITableCellSibling) {
    abstract class TableCellSibling extends baseClass {
        get previousSiblingTableCell(): TableCellBase | undefined {
            const previousSibling: Node | undefined = this.previousSibling;
            return previousSibling && previousSibling.isTableCell() ? previousSibling : undefined;
        }

        get nextSiblingTableCell(): TableCellBase | undefined {
            const nextSibling: Node | undefined = this.nextSibling;
            return nextSibling && nextSibling.isTableCell() ? nextSibling : undefined;
        }
    }
    return TableCellSibling;
}
