import { Content, IContentConstructor } from "../Content";
import { TableRowBase } from "../TableRowBase";
import { Node } from "../Node";

export interface ITableRowSibling {
    /**
     * Gets the previous sibling of this node if that sibling is a {@link TableRowBase}.
     */
    readonly previousSiblingTableRow: TableRowBase | undefined;
    /**
     * Gets the next sibling of this node if that sibling is a {@link TableRowBase}.
     */
    readonly nextSiblingTableRow: TableRowBase | undefined;
}

export function TableRowSiblingMixin<TBase extends IContentConstructor>(baseClass: TBase): TBase & (new (...args: any[]) => ITableRowSibling);
export function TableRowSiblingMixin<TBase extends new (...args: any[]) => Content>(baseClass: TBase): TBase & (new (...args: any[]) => ITableRowSibling) {
    abstract class TableRowSibling extends baseClass {
        get previousSiblingTableRow(): TableRowBase | undefined {
            const previousSibling: Node | undefined = this.previousSibling;
            return previousSibling && previousSibling.isTableRow() ? previousSibling : undefined;
        }
        get nextSiblingTableRow(): TableRowBase | undefined {
            const nextSibling: Node | undefined = this.nextSibling;
            return nextSibling && nextSibling.isTableRow() ? nextSibling : undefined;
        }
    }
    return TableRowSibling;
}
