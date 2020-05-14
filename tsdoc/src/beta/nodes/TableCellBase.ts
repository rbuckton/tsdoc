import { Block, IBlockParameters } from "./Block";
import { TableRowBase } from "./TableRowBase";
import { ContentUtils } from "../utils/ContentUtils";
import { TableBase, TableAlignment } from "./TableBase";
import { Node } from "./Node";
import { mixin } from "../mixin";
import { InlineContainerMixin, IInlineContainerParameters } from "./mixins/InlineContainerMixin";
import { TableCellSiblingMixin } from "./mixins/TableCellSiblingMixin";
import { TableRowChildMixin } from "./mixins/TableRowChildMixin";

export interface ITableCellBaseParameters extends IBlockParameters, IInlineContainerParameters {
}

export abstract class TableCellBase extends mixin(Block, [
    TableRowChildMixin,
    TableCellSiblingMixin,
    InlineContainerMixin,
]) {
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
        const parentRow: TableRowBase | undefined = this.parentTableRow;
        return parentRow && parentRow.parentTable;
    }

    /**
     * Gets the column index of this cell within its parent row.
     */
    public get columnIndex(): number {
        const parentRow: TableRowBase | undefined = this.parentTableRow;
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
        const parentRow: TableRowBase | undefined = this.parentTableRow;
        return !!parentRow && parentRow.isHeaderRow();
    }

    /**
     * Determines whether this cell belongs to a data row of a table.
     */
    public isDataCell(): boolean {
        const parentRow: TableRowBase | undefined = this.parentTableRow;
        return !!parentRow && parentRow.isDataRow();
    }

    /**
     * {@inheritDoc Node.isTableCell()}
     * @override
     */
    public isTableCell(): true {
        return true;
    }
}
