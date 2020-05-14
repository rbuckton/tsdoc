import { BlockParser } from "../../../parser/BlockParser";
import { SyntaxKind } from "../../../nodes/SyntaxKind";
import { GfmTable } from "../../../nodes/GfmTable";
import { Scanner } from "../../../parser/Scanner";
import { Token, TokenLike } from "../../../parser/Token";
import { TableAlignment } from "../../../nodes/TableBase";
import { ContentWriter } from "../../../parser/ContentWriter";
import { GfmTableRow } from "../../../nodes/GfmTableRow";
import { Block } from "../../../nodes/Block";
import { Preprocessor } from "../../../parser/Preprocessor";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { GfmTableRowSyntax } from "./GfmTableRowSyntax";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IBlockSyntax } from "../../IBlockSyntax";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { HtmlWriter } from "../../../emitters/HtmlWriter";

export namespace GfmTableSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<IBlockSyntax<GfmTable> & IHtmlEmittable<GfmTable>>(GfmTableSyntax);

    // Special tokens for tables
    const centerAlignedTableDelimiterToken = Symbol("CenterAlignedTableDelimiterToken");    // :-:
    const leftAlignedTableDelimiterToken = Symbol("LeftAlignedTableDelimiterToken");        // :-
    const rightAlignedTableDelimiterToken = Symbol("RightAlignedTableDelimiterToken");      // -:
    const unalignedTableDelimiterToken = Symbol("UnalignedTableDelimiterToken");            // -

    type TableDelimiterToken =
        | typeof centerAlignedTableDelimiterToken
        | typeof leftAlignedTableDelimiterToken
        | typeof rightAlignedTableDelimiterToken
        | typeof unalignedTableDelimiterToken
        ;

    function isTableDelimiterToken(token: TokenLike): token is TableDelimiterToken {
        return token === unalignedTableDelimiterToken
            || token === leftAlignedTableDelimiterToken
            || token === rightAlignedTableDelimiterToken
            || token === centerAlignedTableDelimiterToken;
    }

    function rescanTableDelimiterToken(scanner: Scanner): TokenLike | undefined {
        // https://github.github.com/gfm/#delimiter-row
        if (scanner.token() !== Token.MinusToken &&
            scanner.token() !== Token.ColonToken) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        const leftColon: boolean = scanner.token() === Token.ColonToken;
        const minusLookahead: number = preprocessor.peekCount(0, CharacterCodes.minus);
        if (leftColon && minusLookahead === 0) {
            return undefined;
        }

        const rightColon: boolean = preprocessor.peekIs(minusLookahead, CharacterCodes.colon);
        if (!preprocessor.peekIsAny(minusLookahead + (rightColon ? 1 : 0),
            UnicodeUtils.isSpaceOrTab,
            UnicodeUtils.isLineTerminator,
            CharacterCodes.bar,
            /*eof*/ undefined)) {
            return undefined;
        }

        preprocessor.advance(minusLookahead + (rightColon ? 1 : 0));
        return scanner.setToken(
            leftColon && rightColon ? centerAlignedTableDelimiterToken :
            leftColon ? leftAlignedTableDelimiterToken :
            rightColon ? rightAlignedTableDelimiterToken :
            unalignedTableDelimiterToken
        );
    }

    function tryParseDelimiter(parser: BlockParser): TableAlignment | undefined {
        const scanner: Scanner = parser.scanner;
        scanner.scanWhitespace();

        const token: TokenLike = scanner.rescan(rescanTableDelimiterToken);
        if (!isTableDelimiterToken(token)) {
            return undefined;
        }

        scanner.scan();
        scanner.scanWhitespace();
        return token === leftAlignedTableDelimiterToken ? TableAlignment.Left :
            token === rightAlignedTableDelimiterToken ? TableAlignment.Right :
            token === centerAlignedTableDelimiterToken ? TableAlignment.Center :
            TableAlignment.Unspecified;
    }

    function tryParseDelimiterRow(parser: BlockParser): ReadonlyArray<TableAlignment> | undefined {
        const scanner: Scanner = parser.scanner;
        const alignments: TableAlignment[] = [];

        // A delimiter row may start with an optional `|` token. We continue processing delimiters
        // as long as we encounter another `|` token that isn't followed by a line ending.
        scanner.expect(Token.BarToken);
        do {
            const alignment: TableAlignment | undefined = tryParseDelimiter(parser);
            if (alignment === undefined) {
                return undefined;
            }
            alignments.push(alignment);
        }
        while (scanner.expect(Token.BarToken) && !Token.isLineEnding(scanner.token()));

        // If we failed to encounter a valid delimiter then this isn't a valid table.
        if (alignments.length === 0 || !Token.isLineEnding(scanner.token())) {
            return undefined;
        }

        return alignments;
    }

    function lookAheadHasFollowingLine(scanner: Scanner): boolean {
        scanner.scanLine();
        scanner.expect(Token.NewLineTrivia);
        return scanner.token() !== Token.EndOfFileToken;
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
        if (parser.indented || container.kind !== SyntaxKind.MarkdownParagraph) {
            return undefined;
        }

        const alignments: ReadonlyArray<TableAlignment> | undefined = tryParseDelimiterRow(parser);
        if (!alignments) {
            return undefined;
        }

        // try to parse the header row from the preceding paragraph's contents
        const content: ContentWriter | undefined = parser.getContent(container);
        if (!content || content.length === 0) {
            return undefined;
        }

        // create a new scanner from the paragraph's contents to use to parse the header row
        const scanner: Scanner = new Scanner(content.toString(), content.mappings);
        scanner.scan();

        // copy non-table paragraph content to a new content writer.
        let newParagraphContent: ContentWriter | undefined;
        while (scanner.lookAhead(lookAheadHasFollowingLine)) {
            if (!newParagraphContent) {
                newParagraphContent = new ContentWriter();
            }
            newParagraphContent.addMapping(scanner.startPos);
            newParagraphContent.write(scanner.scanLine() + '\n');
            container.end = scanner.startPos;
            scanner.scan();
        }

        // try to parse the header row from the last line of the preceding paragraph.
        const headerRow: GfmTableRow | undefined = GfmTableRowSyntax.tryParseRow(parser, scanner);
        if (!headerRow || !Token.isLineEnding(scanner.token())) {
            return undefined;
        }

        // if the column count doesn't match the number of columns in the delimiter row, then this is not a valid table.
        if (headerRow.columnCount !== alignments.length) {
            return undefined;
        }

        const node: GfmTable = new GfmTable({ pos: headerRow.pos, alignments });
        node.appendChild(headerRow);
        container.insertSiblingAfter(node);

        // If the paragraph contained preceding non-table content, replace the content; otherwise,
        // we remove the empty paragraph node.
        if (newParagraphContent) {
            content.clear();
            content.copyFrom(newParagraphContent);
        } else {
            container.removeNode();
        }

        // consume the remainder of the line
        parser.scanner.scanLine();
        return node;
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
    export function tryContinueBlock(parser: BlockParser, block: GfmTable): boolean {
        // A blank line ends the table.
        return !parser.blank;
    }

    /**
     * Finishes the current block, performing any necessary block-level post-processing.
     * @param parser The parser used to parse the Block.
     * @param block The Block to finish.
     */
    export function finishBlock(parser: BlockParser, block: GfmTable): void {
        // Tables have no finish behavior.
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: GfmTable): void {
        writer.writeLine();
        writer.writeTag('table');
        writer.writeLine();
        writer.writeContents(node);
        writer.writeLine();
        writer.writeTag('/table');
        writer.writeLine();
    }
}
