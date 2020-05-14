import { SyntaxKind } from "./SyntaxKind";
import { TableRowBase, ITableRowBaseParameters } from "./TableRowBase";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { GfmTableRowSyntax } from "../syntax/gfm/block/GfmTableRowSyntax";
import { GfmTable } from "./GfmTable";
import { TableBase } from "./TableBase";
import { GfmTableCell } from "./GfmTableCell";
import { TableCellBase } from "./TableCellBase";

export interface IGfmTableRowParameters extends ITableRowBaseParameters {
}

export class GfmTableRow extends TableRowBase {
    public constructor(parameters?: IGfmTableRowParameters) {
        super(parameters);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.GfmTableRow {
        return SyntaxKind.GfmTableRow;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<GfmTableRow> {
        return GfmTableRowSyntax;
    }

    /**
     * Gets the parent of this node, if that parent is a {@link GfmTable}.
     */
    public get parentGfmTable(): GfmTable | undefined {
        const parent: TableBase | undefined = this.parentTable;
        return parent && parent.kind === SyntaxKind.GfmTable ? parent as GfmTable : undefined;
    }

    /**
     * Gets the previous sibling of this node, if that sibling is a {@link GfmTableRow}.
     */
    public get previousSiblingGfmTableRow(): GfmTableRow | undefined {
        const previousSibling: TableRowBase | undefined = this.previousSiblingTableRow;
        return previousSibling && previousSibling.kind === SyntaxKind.GfmTableRow ? previousSibling as GfmTableRow : undefined;
    }

    /**
     * Gets the next sibling of this node, if that sibling is a {@link GfmTableRow}.
     */
    public get nextSiblingGfmTableRow(): GfmTableRow | undefined {
        const nextSibling: TableRowBase | undefined = this.nextSiblingTableRow;
        return nextSibling && nextSibling.kind === SyntaxKind.GfmTableRow ? nextSibling as GfmTableRow : undefined;
    }

    /**
     * Gets the first child of this node, if that child is a {@link GfmTableCell}.
     */
    public get firstChildGfmTableCell(): GfmTableCell | undefined {
        const firstChild: TableCellBase | undefined = this.firstChildTableCell;
        return firstChild && firstChild.kind === SyntaxKind.GfmTableCell ? firstChild as GfmTableCell : undefined;
    }

    /**
     * Gets the last child of this node, if that child is a {@link GfmTableCell}.
     */
    public get lastChildGfmTableCell(): GfmTableCell | undefined {
        const lastChild: TableCellBase | undefined = this.lastChildTableCell;
        return lastChild && lastChild.kind === SyntaxKind.GfmTableCell ? lastChild as GfmTableCell : undefined;
    }
}
