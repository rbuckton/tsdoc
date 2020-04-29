import { SyntaxKind } from "./SyntaxKind";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { TableCellBase, ITableCellBaseParameters } from "./TableCellBase";

export interface IGfmTableCellParameters extends ITableCellBaseParameters {
}

export class GfmTableCell extends TableCellBase {
    public constructor(parameters?: IGfmTableCellParameters) {
        super(parameters);
    }

    public get kind(): SyntaxKind.GfmTableCell {
        return SyntaxKind.GfmTableCell;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        throw new Error("Not yet implemented.");
    }
}
