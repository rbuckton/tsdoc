import { StartResult, ContinueResult } from "./IBlockSyntaxParser";
import { BlockParser } from "../BlockParser";
import { SyntaxKind } from "../../nodes/SyntaxKind";
import { Node } from "../../nodes/Node";
import { GfmTable } from "../../nodes/GfmTable";
import { MarkdownParagraph } from "../../nodes/MarkdownParagraph";
import { Scanner, IScannerState } from "../Scanner";
import { Token } from "../Token";
import { TableAlignment } from "../../nodes/TableBase";
import { GfmTableScanner } from "../scanners/GfmTableScanner";
import { MarkdownParagraphParser } from "./MarkdownParagraphParser";
import { ContentWriter } from "../ContentWriter";
import { GfmTableRow } from "../../nodes/GfmTableRow";
import { MarkdownBackslashEscapeScanner } from "../scanners/MarkdownBackslashEscapeScanner";
import { GfmTableCell } from "../../nodes/GfmTableCell";
import { TableCellBase } from "../../nodes/TableCellBase";
import { TableRowBase } from "../../nodes/TableRowBase";
import { InlineParser } from "../InlineParser";

export namespace GfmTableParser {
    export const kind: SyntaxKind.GfmTable = SyntaxKind.GfmTable;

    interface ICellState {
        content: ContentWriter;
    }

    function createCellState(): ICellState {
        return {
            content: new ContentWriter()
        };
    }

    function getState(parser: BlockParser, cell: TableCellBase): ICellState {
        return parser.getState(GfmTableParser, cell, createCellState);
    }

    function tryParseBarToken(scanner: Scanner): boolean {
        if (scanner.token() === Token.BarToken) {
            scanner.scan();
            return true;
        }
        return false;
    }

    function tryParseCell(parser: BlockParser, scanner: Scanner): GfmTableCell | undefined {
        const pos: number = scanner.startPos;
        const node: GfmTableCell = new GfmTableCell({ pos });
        const state: ICellState = getState(parser, node);

        let hasCell: boolean = scanner.scanWhitespace();
        let textPos: number = scanner.startPos;
        while (!Token.isLineEnding(scanner.token()) && scanner.token() !== Token.BarToken) {
            if (scanner.rescan(MarkdownBackslashEscapeScanner.rescanBackslashEscape) === Token.BackslashEscapeCharacter &&
                scanner.getTokenValue() === '|') {
                state.content.addMapping(textPos);
                state.content.write(scanner.slice(textPos, scanner.startPos));
                state.content.addMapping(scanner.startPos);
                state.content.write(scanner.getTokenValue());
                textPos = scanner.pos;
            }
            scanner.scan();
            hasCell = true;
        }

        state.content.addMapping(textPos);
        state.content.write(scanner.slice(textPos, scanner.startPos));

        const end: number = scanner.startPos;
        if (!hasCell && scanner.token() !== Token.BarToken) {
            return undefined;
        }

        node.end = end;
        return node;
    }

    function tryParseRow(parser: BlockParser, scanner: Scanner): GfmTableRow | undefined {
        if (parser.blank) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const row: GfmTableRow = new GfmTableRow({ pos });
        let hasCells: boolean = false;
        tryParseBarToken(scanner);
        do {
            const cell: GfmTableCell | undefined = tryParseCell(parser, scanner);
            if (!cell) {
                break;
            }
            row.appendChild(cell);
            hasCells = true;
        }
        while (tryParseBarToken(scanner));
        if (!hasCells || !Token.isLineEnding(scanner.token())) {
            return undefined;
        }
        row.end = scanner.startPos;
        return row;
    }

    function tryParseDelimiter(parser: BlockParser): TableAlignment | undefined {
        const scanner: Scanner = parser.scanner;
        scanner.scanWhitespace();

        const token: Token = scanner.rescan(GfmTableScanner.rescanTableDelimiterToken);
        if (!Token.isTableDelimiterToken(token)) {
            return undefined;
        }

        scanner.scan();
        scanner.scanWhitespace();
        return token === Token.LeftAlignedTableDelimiterToken ? TableAlignment.Left :
            token === Token.RightAlignedTableDelimiterToken ? TableAlignment.Right :
            token === Token.CenterAlignedTableDelimiterToken ? TableAlignment.Center :
            TableAlignment.Unspecified;
    }

    function tryParseDelimiterRow(parser: BlockParser): ReadonlyArray<TableAlignment> | undefined {
        const scanner: Scanner = parser.scanner;
        const alignments: TableAlignment[] = [];

        // try to parse the delimiter row
        tryParseBarToken(scanner);
        do {
            const alignment: TableAlignment | undefined = tryParseDelimiter(parser);
            if (alignment === undefined) {
                return undefined;
            }

            alignments.push(alignment);
        }
        while (tryParseBarToken(scanner) && !Token.isLineEnding(scanner.token()));

        if (alignments.length === 0 || !Token.isLineEnding(scanner.token())) {
            return undefined;
        }

        return alignments;
    }

    function tryParseTableHeader(parser: BlockParser, container: MarkdownParagraph): boolean {
        const scanner: Scanner = parser.scanner;
        const alignments: ReadonlyArray<TableAlignment> | undefined = tryParseDelimiterRow(parser);
        if (!alignments) {
            return false;
        }

        // try to parse the header row from the preceding paragraph
        const content: ContentWriter | undefined = MarkdownParagraphParser.getContent(parser, container);
        if (!content || content.length === 0) {
            return false;
        }

        // try to parse the header row from the paragraph's contents
        const headerScanner: Scanner = new Scanner(content.toString(), content.mappings);
        headerScanner.scan();
        const headerRow: GfmTableRow | undefined = tryParseRow(parser, headerScanner);
        if (!headerRow || !Token.isLineEnding(headerScanner.token()) || headerScanner.scan() !== Token.EndOfFileToken) {
            return false;
        }

        // compute the number of columns in the row
        let columnCount: number = 0;
        for (let cell: TableCellBase | undefined = headerRow.firstChildTableCell; cell; cell = cell.nextSiblingTableCell) {
            columnCount++;
        }

        // if the column count doesn't match the delimiter row, then this is not a valid table.
        if (columnCount !== alignments.length) {
            return false;
        }

        parser.finishUnmatchedBlocks();

        const node: GfmTable = new GfmTable({ pos: headerRow.pos, alignments });
        node.appendChild(headerRow);

        parser.setTip(node);
        container.insertSiblingAfter(node);
        container.removeNode();
        scanner.scanLine();
        return true;
    }

    function tryStartTable(parser: BlockParser, container: MarkdownParagraph): StartResult {
        const scanner: Scanner = parser.scanner;
        const state: IScannerState = scanner.getState();
        if (tryParseTableHeader(parser, container)) {
            return StartResult.Leaf;
        }
        scanner.setState(state);
        return StartResult.Unmatched;
    }

    function tryStartRow(parser: BlockParser, container: GfmTable): StartResult {
        const scanner: Scanner = parser.scanner;
        const state: IScannerState = scanner.getState();
        const row: GfmTableRow | undefined = tryParseRow(parser, parser.scanner);
        if (!row) {
            scanner.setState(state);
            return StartResult.Unmatched;
        }

        let columnCountDelta: number = container.columnCount - row.columnCount;
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
        return StartResult.Leaf;
    }

    export function tryStart(parser: BlockParser, container: Node): StartResult {
        // https://github.github.com/gfm/#tables-extension-
        if (parser.indent <= 3 && container.kind === SyntaxKind.MarkdownParagraph) {
            return tryStartTable(parser, container as MarkdownParagraph);
        } else if (parser.indent <= 3 && container.kind === SyntaxKind.GfmTable) {
            return tryStartRow(parser, container as GfmTable);
        }
        return StartResult.Unmatched;
    }

    export function tryContinue(parser: BlockParser, block: GfmTable): ContinueResult {
        return parser.blank ? ContinueResult.Unmatched : ContinueResult.Matched;
    }

    export function finish(parser: BlockParser, block: GfmTable): void {
    }

    export function processInlines(parser: BlockParser, block: GfmTable): void {
        for (let row: TableRowBase | undefined = block.firstChildTableRow; row; row = row.nextSiblingTableRow) {
            for (let cell: TableCellBase | undefined = row.firstChildTableCell; cell; cell = cell.nextSiblingTableCell) {
                const state: ICellState = getState(parser, cell);
                const inlineParser: InlineParser = new InlineParser(parser.document, state.content.toString(), state.content.mappings);
                inlineParser.parse(cell);
            }
        }
    }
}
