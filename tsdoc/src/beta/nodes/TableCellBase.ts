import { Block, IBlockParameters } from "./Block";
import { Content } from "./Content";
import { IInlineContainer, Inline, IInlineContainerParameters } from "./Inline";
import { TableRowBase } from "./TableRowBase";
import { ContentUtils } from "./ContentUtils";
import { TableBase, TableAlignment } from "./TableBase";
import { Node } from "./Node";

export interface ITableCellBaseParameters extends IBlockParameters, IInlineContainerParameters {
}

export interface ITableCellContainer extends Content {
    isTableCellContainer(): true;
    readonly firstChildTableCell: TableCellBase | undefined;
    readonly lastChildTableCell: TableCellBase | undefined;
}

export interface ITableCellContainerParameters {
    content?: TableCellBase | ReadonlyArray<TableCellBase>;
}


export abstract class TableCellBase extends Block implements IInlineContainer {
    private _cachedColumnIndex: number | undefined;
    private _cachedParentRow: TableRowBase | undefined;
    private _cachedParentRowVersion: number | undefined;
    private _cachedAlignment: TableAlignment | undefined;
    private _cachedContainingTable: TableBase | undefined;
    private _cachedContainingTableVersion: number | undefined;

    public constructor(parameters?: ITableCellBaseParameters) {
        super(parameters);
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /**
     * Gets the containing table for this cell.
     */
    public get containingTable(): TableBase | undefined {
        const parentRow: TableRowBase | undefined = this.parentRow;
        return parentRow && parentRow.parentTable;
    }

    /**
     * Gets the parent of this node, if that parent is a `TableRowBase`.
     */
    public get parentRow(): TableRowBase | undefined {
        return this.parent && this.parent.isTableRow() ? this.parent : undefined;
    }

    /**
     * Gets the previous sibling of this node, if that sibling is a `TableCellBase`.
     */
    public get previousSiblingTableCell(): TableCellBase | undefined {
        return this.previousSibling && this.previousSibling.isTableCell() ? this.previousSibling : undefined;
    }

    /**
     * Gets the next sibling of this node, if that sibling is a `TableCellBase`.
     */
    public get nextSiblingTableCell(): TableCellBase | undefined {
        return this.nextSibling && this.nextSibling.isTableCell() ? this.nextSibling : undefined;
    }

    /**
     * Gets the first child of this node, if that child is an `Inline`.
     */
    public get firstChildInline(): Inline | undefined {
        return this.firstChild && this.firstChild.isInline() ? this.firstChild : undefined;
    }

    /**
     * Gets the last child of this node, if that child is an `Inline`.
     */
    public get lastChildInline(): Inline | undefined {
        return this.lastChild && this.lastChild.isInline() ? this.lastChild : undefined;
    }

    /**
     * Gets the column index of this cell within its parent row.
     */
    public get columnIndex(): number {
        const parentRow: TableRowBase | undefined = this.parentRow;
        if (!parentRow) return 0;
        if (this._cachedColumnIndex !== undefined &&
            this._cachedParentRow === parentRow &&
            this._cachedParentRowVersion === Node._getVersion(parentRow)) {
            return this._cachedColumnIndex;
        }
        let columnIndex: number = 0;
        for (let cell: TableCellBase | undefined = parentRow.firstChildTableCell; cell && cell !== this; cell = cell.nextSiblingTableCell) {
            columnIndex++;
        }
        this._cachedColumnIndex = columnIndex;
        this._cachedParentRow = parentRow;
        this._cachedParentRowVersion = Node._getVersion(parentRow);
        return columnIndex;
    }

    /**
     * Gets the alignment of this cell within its containing table.
     */
    public get alignment(): TableAlignment {
        const table: TableBase | undefined = this.containingTable;
        if (!table) return TableAlignment.Unspecified;
        if (this._cachedAlignment !== undefined &&
            this._cachedContainingTable === table &&
            this._cachedContainingTableVersion === Node._getVersion(table)) {
            return this._cachedAlignment;
        }
        const columnIndex: number = this.columnIndex;
        if (columnIndex < 0 || columnIndex >= table.alignments.length) {
            return TableAlignment.Unspecified;
        }
        const alignment: TableAlignment = table.alignments[columnIndex];
        this._cachedAlignment = alignment;
        this._cachedContainingTable = table;
        this._cachedContainingTableVersion = Node._getVersion(table);
        return alignment;
    }

    /**
     * Determines whether this cell belongs to the header row of a table.
     */
    public isHeaderCell(): boolean {
        return !!this.parentRow && this.parentRow.isHeaderRow();
    }

    /**
     * Determines whether this cell belongs to a data row of a table.
     */
    public isDataCell(): boolean {
        return !!this.parentRow && this.parentRow.isDataRow();
    }

    /** @override */
    public isTableCell(): true {
        return true;
    }

    /** @override */
    public isInlineContainer(): true {
        return true;
    }
}
