import { Block, IBlockParameters } from "./Block";
import { ITableRowContainerParameters, ITableRowContainer, TableRowBase } from "./TableRowBase";
import { ContentUtils } from "./ContentUtils";

export interface ITableBaseParameters extends IBlockParameters, ITableRowContainerParameters {
    alignments?: ReadonlyArray<TableAlignment>;
}

export const enum TableAlignment {
    Unspecified,
    Left,
    Center,
    Right
}

export abstract class TableBase extends Block implements ITableRowContainer {
    private _alignments: ReadonlyArray<TableAlignment>;

    public constructor(parameters?: ITableBaseParameters) {
        super(parameters);
        this._alignments = parameters && parameters.alignments || [];
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    public get columnCount(): number {
        const headerRow: TableRowBase | undefined = this.headerRow;
        return headerRow ? headerRow.columnCount : 0;
    }

    public get alignments(): ReadonlyArray<TableAlignment> {
        return this._alignments;
    }

    public set alignments(value: ReadonlyArray<TableAlignment>) {
        if (this._alignments !== value) {
            this.beforeChange();
            this._alignments = value;
            this.afterChange();
        }
    }

    /**
     * Gets the first child of this node, if that child is a `TableRowBase`.
     */
    public get firstChildTableRow(): TableRowBase | undefined {
        return this.firstChild && this.firstChild.isTableRow() ? this.firstChild : undefined;
    }

    /**
     * Gets the last child of this node, if that child is a `TableRowBase`.
     */
    public get lastChildTableRow(): TableRowBase | undefined {
        return this.lastChild && this.lastChild.isTableRow() ? this.lastChild : undefined;
    }

    /**
     * Gets the header row of this table.
     */
    public get headerRow(): TableRowBase | undefined {
        return this.firstChild && this.firstChild.isTableRow() ? this.firstChild : undefined;
    }

    /**
     * Gets the first data row of the table.
     */
    public get firstDataRow(): TableRowBase | undefined {
        const headerRow: TableRowBase | undefined = this.headerRow;
        return headerRow ? headerRow.nextSiblingTableRow : undefined;
    }

    /**
     * Gets the last data row of the table.
     */
    public get lastDataRow(): TableRowBase | undefined {
        const lastRow: TableRowBase | undefined = this.lastChildTableRow;
        return lastRow && lastRow !== this.headerRow ? lastRow : undefined;
    }

    /** @override */
    public isTable(): true {
        return true;
    }

    /** @override */
    public isTableRowContainer(): true {
        return true;
    }
}
