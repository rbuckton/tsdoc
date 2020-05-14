import { SyntaxKind } from "./SyntaxKind";
import { TableBase, ITableBaseParameters } from "./TableBase";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { GfmTableSyntax } from "../syntax/gfm/block/GfmTableSyntax";
import { TableRowBase } from "./TableRowBase";
import { GfmTableRow } from "./GfmTableRow";

export interface IGfmTableTableParameters extends ITableBaseParameters {
}

export class GfmTable extends TableBase {
    public constructor(parameters?: IGfmTableTableParameters) {
        super(parameters);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.GfmTable {
        return SyntaxKind.GfmTable;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<GfmTable> {
        return GfmTableSyntax;
    }

    /**
     * Gets the first child of this node, if that child is a {@link GfmTableRow}.
     */
    public get firstChildGfmTableRow(): GfmTableRow | undefined {
        const firstChild: TableRowBase | undefined = this.firstChildTableRow;
        return firstChild && firstChild.kind === SyntaxKind.GfmTableRow ? firstChild as GfmTableRow : undefined;
    }

    /**
     * Gets the last child of this node, if that child is a {@link GfmTableRow}.
     */
    public get lastChildGfmTableRow(): GfmTableRow | undefined {
        const lastChild: TableRowBase | undefined = this.lastChildTableRow;
        return lastChild && lastChild.kind === SyntaxKind.GfmTableRow ? lastChild as GfmTableRow : undefined;
    }
}
