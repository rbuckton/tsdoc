import { Token } from "../../../parser/Token";
import { BlockParser } from "../../../parser/BlockParser";
import { MarkdownBlockQuote } from "../../../nodes/MarkdownBlockQuote";
import { Scanner } from "../../../parser/Scanner";
import { Block } from "../../../nodes/Block";
import { IBlockSyntax } from "../../IBlockSyntax";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";

/**
 * An {@link IBlockSyntax} for Commonmark Block Quotes &mdash; https://spec.commonmark.org/0.29/#block-quotes
 *
 * @remarks
 * A markdown block quote is a block of text where each line is prefixed with a `>` character.
 */
export namespace MarkdownBlockQuoteSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IBlockSyntax<MarkdownBlockQuote>
        & IHtmlEmittable<MarkdownBlockQuote>
        & ITSDocEmittable<MarkdownBlockQuote>
    >(MarkdownBlockQuoteSyntax);

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
        // https://spec.commonmark.org/0.29/#block-quotes
        //
        // A block quote marker consists of 0-3 spaces of initial indent, plus
        // the character `>` together with a following space, or a single character `>`
        // not followed by a space.
        const scanner: Scanner = parser.scanner;
        const pos: number = scanner.startPos;
        if (parser.indented || !scanner.expect(Token.GreaterThanToken)) {
            return undefined;
        }

        if (Token.isIndentCharacter(scanner.token())) {
            scanner.scanColumns(1);
        }

        const node: MarkdownBlockQuote = new MarkdownBlockQuote({ pos });
        parser.pushBlock(container, node);
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
    export function tryContinueBlock(parser: BlockParser, block: MarkdownBlockQuote): boolean {
        // https://spec.commonmark.org/0.29/#block-quotes
        const scanner: Scanner = parser.scanner;
        if (!parser.indented && scanner.expect(Token.GreaterThanToken)) {
            if (Token.isIndentCharacter(scanner.token())) {
                scanner.scanColumns(1);
            }
            return true;
        }

        return false;
    }

    /**
     * Finishes the current block, performing any necessary block-level post-processing.
     * @param parser The parser used to parse the Block.
     * @param block The Block to finish.
     */
    export function finishBlock(parser: BlockParser, block: MarkdownBlockQuote): void {
        // Block quotes have no finish behavior.
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: MarkdownBlockQuote): void {
        writer.writeLine();
        writer.writeTag('blockquote');
        writer.writeLine();
        writer.writeContents(node);
        writer.writeLine();
        writer.writeTag('/blockquote');
        writer.writeLine();
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownBlockQuote): void {
        writer.pushBlock({ linePrefix: '> ' });
        writer.writeContents(node);
        writer.popBlock();
    }
}
