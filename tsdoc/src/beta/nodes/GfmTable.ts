import { SyntaxKind } from "./SyntaxKind";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { TableBase, ITableBaseParameters } from "./TableBase";

export interface IGfmTableTableParameters extends ITableBaseParameters {
}

export class GfmTable extends TableBase {
    public constructor(parameters?: IGfmTableTableParameters) {
        super(parameters);
    }

    public get kind(): SyntaxKind.GfmTable {
        return SyntaxKind.GfmTable;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        throw new Error("Not yet implemented.");
    }
}
