import { BlockParser } from "../../../parser/BlockParser";
import { Block } from "../../../nodes/Block";
import { GfmTableRow } from "../../../nodes/GfmTableRow";
import { SyntaxKind } from "../../../nodes/SyntaxKind";
import { GfmTable } from "../../../nodes/GfmTable";
import { GfmTableCell } from "../../../nodes/GfmTableCell";
import { Scanner } from "../../../parser/Scanner";
import { Token } from "../../../parser/Token";
import { GfmTableCellSyntax } from "./GfmTableCellSyntax";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IBlockSyntax } from "../../IBlockSyntax";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { HtmlWriter } from "../../../emitters/HtmlWriter";

export namespace GfmTableRowSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<IBlockSyntax<GfmTableRow> & IHtmlEmittable<GfmTableRow>>(GfmTableRowSyntax);

    /**
     * Attempts to parse a GfmTableRow using the provided Scanner.
     *
     * NOTE: This function should be executed inside of a call to BlockParser.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param parser The parser used to parse the row.
     * @param scanner The scanner used to produce tokens.
     * @returns A new GfmTableRow, if one could be parsed; otherwise, `undefined`.
     */
    export function tryParseRow(parser: BlockParser, scanner: Scanner): GfmTableRow | undefined {
        if (parser.blank) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const row: GfmTableRow = new GfmTableRow({ pos });
        let hasCells: boolean = false;
        scanner.expect(Token.BarToken);
        do {
            const cell: GfmTableCell | undefined = GfmTableCellSyntax.tryParseCell(parser, scanner);
            if (!cell) {
                break;
            }
            row.appendChild(cell);
            hasCells = true;
        }
        while (scanner.expect(Token.BarToken));
        if (!hasCells || !Token.isLineEnding(scanner.token())) {
            return undefined;
        }
        row.end = scanner.startPos;
        return row;
    }

    /**
     * Attempts to start a new Block syntax at the current token.
     *
     * NOTE: This function should be executed inside of a call to BlockParser.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param parser The parser used to parse the Block.
     * @param container The containing Block for the current token.
     * @returns A new Block if the block was started; otherwise, `undefined`.
     */
    export function tryStartBlock(parser: BlockParser, container: Block): Block | undefined {
        // https://github.github.com/gfm/#tables-extension-
        if (!parser.indent && container.kind === SyntaxKind.GfmTable) {
            const row: GfmTableRow | undefined = tryParseRow(parser, parser.scanner);
            if (!row) {
                return undefined;
            }
            let columnCountDelta: number = (container as GfmTable).columnCount - row.columnCount;
            while (columnCountDelta < 0) {
                if (row.lastChildTableCell) {
                    row.lastChildTableCell.removeNode();
                }
                columnCountDelta++;
            }
            while (columnCountDelta > 0) {
                row.appendChild(new GfmTableCell());
                columnCountDelta--;
            }
            container.appendChild(row);
            return row;
        }
        return undefined;
    }

    /**
     * Attempts to continue an existing Block syntax on a subsequent line.
     *
     * NOTE: This function should be executed inside of a call to BlockParser.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param parser The parser used to parse the Block.
     * @param block The Block to continue.
     * @returns `true` if the Block was continued; otherwise, `false`.
     */
    export function tryContinueBlock(parser: BlockParser, block: GfmTableRow): boolean {
        // Table rows cannot be continued.
        return false;
    }

    /**
     * Finishes the current block, performing any necessary block-level post-processing.
     * @param parser The parser used to parse the Block.
     * @param block The Block to finish.
     */
    export function finishBlock(parser: BlockParser, block: GfmTableRow): void {
        // Table rows have no finish behavior.
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: GfmTableRow): void {
        if (node.isHeaderRow()) {
            writer.writeLine();
            writer.writeTag('thead');
        } else if (node.parentTable && node.parentTable.firstDataRow === node) {
            writer.writeLine();
            writer.writeTag('tbody');
        }

        writer.writeLine();
        writer.writeTag('tr');
        writer.writeLine();
        writer.writeContents(node);
        writer.writeLine();
        writer.writeTag('/tr');
        writer.writeLine();

        if (node.isHeaderRow()) {
            writer.writeTag('/thead');
            writer.writeLine();
        } else if (node.parentTable && node.parentTable.lastDataRow === node) {
            writer.writeTag('/tbody');
            writer.writeLine();
        }
    }
}