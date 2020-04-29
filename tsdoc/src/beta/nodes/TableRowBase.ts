import { Block, IBlockParameters } from "./Block";
import { Content } from "./Content";
import { ITableCellContainer, ITableCellContainerParameters, TableCellBase } from "./TableCellBase";
import { ContentUtils } from "./ContentUtils";
import { TableBase } from "./TableBase";

export interface ITableRowBaseParameters extends IBlockParameters, ITableCellContainerParameters {
}

export interface ITableRowContainer extends Content {
    isTableRowContainer(): true;
    readonly firstChildTableRow: TableRowBase | undefined;
    readonly lastChildTableRow: TableRowBase | undefined;
}

export interface ITableRowContainerParameters {
    content?: TableRowBase | ReadonlyArray<TableRowBase>;
}

export abstract class TableRowBase extends Block implements ITableCellContainer {
    private _columnCount: number | undefined;

    public constructor(parameters?: ITableRowBaseParameters) {
        super(parameters);
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    public get columnCount(): number {
        if (this._columnCount === undefined) {
            let columnCount: number = 0;
            for (let cell: TableCellBase | undefined = this.firstChildTableCell; cell; cell = cell.nextSiblingTableCell) {
                columnCount++;
            }
            this._columnCount = columnCount;
        }
        return this._columnCount;
    }

    /**
     * Gets the parent of this node, if that parent is a `TableBase`.
     */
    public get parentTable(): TableBase | undefined {
        return this.parent && this.parent.isTable() ? this.parent : undefined;
    }

    /**
     * Gets the previous sibling of this node, if that sibling is a `TableRowBase`.
     */
    public get previousSiblingTableRow(): TableRowBase | undefined {
        return this.previousSibling && this.previousSibling.isTableRow() ? this.previousSibling : undefined;
    }

    /**
     * Gets the next sibling of this node, if that sibling is a `TableRowBase`.
     */
    public get nextSiblingTableRow(): TableRowBase | undefined {
        return this.nextSibling && this.nextSibling.isTableRow() ? this.nextSibling : undefined;
    }

    /**
     * Gets the first child of this node, if that child is a `TableCellBase`.
     */
    public get firstChildTableCell(): TableCellBase | undefined {
        return this.firstChild && this.firstChild.isTableCell() ? this.firstChild : undefined;
    }

    /**
     * Gets the last child of this node, if that child is a `TableCellBase`.
     */
    public get lastChildTableCell(): TableCellBase | undefined {
        return this.lastChild && this.lastChild.isTableCell() ? this.lastChild : undefined;
    }

    /**
     * Determines whether this row is the header row of a table.
     */
    public isHeaderRow(): boolean {
        return !!this.parentTable && this.parentTable.firstChildTableRow === this;
    }

    /**
     * Determines whether this row is a data row of a table.
     */
    public isDataRow(): boolean {
        return !!this.parentTable && this.parentTable.firstChildTableRow !== this;
    }

    /** @override */
    public isTableRow(): true {
        return true;
    }

    /** @override */
    public isTableCellContainer(): true {
        return true;
    }

    /** @override */
    protected onInvalidated() {
        super.onInvalidated();
        this._columnCount = undefined;
    }
}
