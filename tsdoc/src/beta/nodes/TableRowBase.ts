import { Block, IBlockParameters } from "./Block";
import { TableCellBase } from "./TableCellBase";
import { ContentUtils } from "../utils/ContentUtils";
import { TableCellContainerMixin, ITableCellContainerParameters } from "./mixins/TableCellContainerMixin";
import { mixin } from "../mixin";
import { TableRowSiblingMixin } from "./mixins/TableRowSiblingMixin";
import { TableChildMixin } from "./mixins/TableChildMixin";

export interface ITableRowBaseParameters extends IBlockParameters, ITableCellContainerParameters {
}

export abstract class TableRowBase extends mixin(Block, [
    TableChildMixin,
    TableRowSiblingMixin,
    TableCellContainerMixin,
]) {
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

    /**
     * {@inheritDoc Node.isTableRow()}
     * @override
     */
    public isTableRow(): true {
        return true;
    }

    /**
     * {@inheritDoc Node.onInvalidated()}
     * @override
     */
    protected onInvalidated() {
        super.onInvalidated();
        this._columnCount = undefined;
    }
}
