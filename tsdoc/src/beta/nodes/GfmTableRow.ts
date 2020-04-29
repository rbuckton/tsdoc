import { SyntaxKind } from "./SyntaxKind";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { TableRowBase, ITableRowBaseParameters } from "./TableRowBase";

export interface IGfmTableRowParameters extends ITableRowBaseParameters {
}

export class GfmTableRow extends TableRowBase {
    public constructor(parameters?: IGfmTableRowParameters) {
        super(parameters);
    }

    public get kind(): SyntaxKind.GfmTableRow {
        return SyntaxKind.GfmTableRow;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        throw new Error("Not yet implemented.");
    }
}
