import { SyntaxKind } from "./SyntaxKind";
import { TableCellBase, ITableCellBaseParameters } from "./TableCellBase";
import { GfmTableCellSyntax } from "../syntax/gfm/block/GfmTableCellSyntax";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { GfmTableRow } from "./GfmTableRow";
import { TableRowBase } from "./TableRowBase";

export interface IGfmTableCellParameters extends ITableCellBaseParameters {
}

export class GfmTableCell extends TableCellBase {
    public constructor(parameters?: IGfmTableCellParameters) {
        super(parameters);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.GfmTableCell {
        return SyntaxKind.GfmTableCell;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<GfmTableCell> {
        return GfmTableCellSyntax;
    }

    /**
     * Gets the parent of this node, if that parent is a {@link GfmTableRow}.
     */
    public get parentGfmTableRow(): GfmTableRow | undefined {
        const parent: TableRowBase | undefined = this.parentTableRow;
        return parent && parent.kind === SyntaxKind.GfmTableRow ? parent as GfmTableRow : undefined;
    }

    /**
     * Gets the previous sibling of this node, if that sibling is a {@link GfmTableCell}.
     */
    public get previousSiblingGfmTableCell(): GfmTableCell | undefined {
        const previousSibling: TableCellBase | undefined = this.previousSiblingTableCell;
        return previousSibling && previousSibling.kind === SyntaxKind.GfmTableCell ? previousSibling as GfmTableCell : undefined;
    }

    /**
     * Gets the next sibling of this node, if that sibling is a {@link GfmTableCell}.
     */
    public get nextSiblingGfmTableCell(): GfmTableCell | undefined {
        const nextSibling: TableCellBase | undefined = this.nextSiblingTableCell;
        return nextSibling && nextSibling.kind === SyntaxKind.GfmTableCell ? nextSibling as GfmTableCell : undefined;
    }
}
