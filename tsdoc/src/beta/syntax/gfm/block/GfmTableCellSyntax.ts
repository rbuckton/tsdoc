import { BlockParser } from "../../../parser/BlockParser";
import { Block } from "../../../nodes/Block";
import { GfmTableCell } from "../../../nodes/GfmTableCell";
import { ContentWriter } from "../../../parser/ContentWriter";
import { Scanner } from "../../../parser/Scanner";
import { Token } from "../../../parser/Token";
import { MarkdownBackslashEscapeSyntax } from "../../commonmark/inline/MarkdownBackslashEscapeSyntax";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IBlockSyntax } from "../../IBlockSyntax";
import { TableAlignment } from "../../../nodes/TableBase";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { HtmlWriter } from "../../../emitters/HtmlWriter";

export namespace GfmTableCellSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<IBlockSyntax<GfmTableCell> & IHtmlEmittable<GfmTableCell>>(GfmTableCellSyntax);

    interface ICellState {
        content: ContentWriter;
    }

    function createCellState(): ICellState {
        return { content: new ContentWriter() };
    }

    function getState(parser: BlockParser, cell: GfmTableCell): ICellState {
        return parser.getState(GfmTableCellSyntax, cell, createCellState);
    }

    /**
     * Attempts to parse a GfmTableCell.
     *
     * NOTE: This function should be executed inside of a call to BlockParser.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param parser The parser used to parse the cell.
     * @param scanner The scanner used to parse the cell.
     */
    export function tryParseCell(parser: BlockParser, scanner: Scanner): GfmTableCell | undefined {
        const pos: number = scanner.startPos;
        const node: GfmTableCell = new GfmTableCell({ pos });
        const { content } = getState(parser, node);

        let hasCell: boolean = scanner.scanWhitespace();
        let textPos: number = scanner.startPos;
        while (!Token.isLineEnding(scanner.token()) && scanner.token() !== Token.BarToken) {
            if (scanner.rescan(MarkdownBackslashEscapeSyntax.rescanBackslashEscape) === MarkdownBackslashEscapeSyntax.backslashEscapeCharacterToken &&
                scanner.getTokenValue() === '|') {
                content.addMapping(textPos);
                content.write(scanner.slice(textPos, scanner.startPos));
                content.addMapping(scanner.startPos);
                content.write(scanner.getTokenValue());
                textPos = scanner.pos;
            }
            scanner.scan();
            hasCell = true;
        }

        content.addMapping(textPos);
        content.write(scanner.slice(textPos, scanner.startPos));

        const end: number = scanner.startPos;
        if (!hasCell && scanner.token() !== Token.BarToken) {
            return undefined;
        }

        node.end = end;
        return node;
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
        // Table cells cannot be started on their own.
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
    export function tryContinueBlock(parser: BlockParser, block: GfmTableCell): boolean {
        // Table cells cannot be continued.
        return false;
    }

    /**
     * Finishes the current block, performing any necessary block-level post-processing.
     * @param parser The parser used to parse the Block.
     * @param block The Block to finish.
     */
    export function finishBlock(parser: BlockParser, block: GfmTableCell): void {
        // Table cells have no finish behavior.
    }

    /**
     * Gets the ContentWriter for the provided Block, if one exists.
     * @param parser The parser used to parse the Block.
     * @param block The Block from which to acquire a ContentWriter.
     * @returns The ContentWriter for the Block, if it exists; otherwise, `undefined`.
     */
    export function getContent(parser: BlockParser, block: GfmTableCell): ContentWriter {
        return getState(parser, block).content;
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: GfmTableCell): void {
        const alignment: TableAlignment = node.alignment;
        const attrs: [string, string][] | undefined =
            alignment === TableAlignment.Left ? [['align', 'left']] :
            alignment === TableAlignment.Center ? [['align', 'center']] :
            alignment === TableAlignment.Right ? [['align', 'right']] :
            undefined;
        writer.writeLine();
        writer.writeTag(node.isHeaderCell() ? 'th' : 'td', attrs);
        writer.writeContents(node);
        writer.writeTag(node.isHeaderCell() ? '/th' : '/td');
        writer.writeLine();
    }
}