import { Block, IBlockParameters } from "./Block";
import { TableRowBase } from "./TableRowBase";
import { ContentUtils } from "../utils/ContentUtils";
import { TableRowContainerMixin, ITableRowContainerParameters } from "./mixins/TableRowContainerMixin";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { BlockSiblingMixin } from "./mixins/BlockSiblingMixin";

export interface ITableBaseParameters extends IBlockParameters, ITableRowContainerParameters {
    alignments?: ReadonlyArray<TableAlignment>;
}

export const enum TableAlignment {
    Unspecified,
    Left,
    Center,
    Right
}

export abstract class TableBase extends mixin(Block, [
    BlockChildMixin,
    BlockSiblingMixin,
    TableRowContainerMixin,
]) {
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
     * Gets the header row of this table.
     */
    public get headerRow(): TableRowBase | undefined {
        return this.firstChildTableRow;
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

    /**
     * {@inheritDoc Node.isTable()}
     * @override
     */
    public isTable(): true {
        return true;
    }
}
