import { Token } from "../../../parser/Token";
import { BlockParser } from "../../../parser/BlockParser";
import { Scanner } from "../../../parser/Scanner";
import { DocBlockTag } from "../../../nodes/DocBlockTag";
import { DocTagName } from "../../../nodes/DocTagName";
import { Block } from "../../../nodes/Block";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IBlockSyntax } from "../../IBlockSyntax";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { DocTagNameSyntax } from "../elements/DocTagNameSyntax";

export namespace DocBlockTagSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IBlockSyntax<DocBlockTag>
    >(DocBlockTagSyntax);

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
        const scanner: Scanner = parser.scanner;
        if (parser.indented) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const tagName: DocTagName | undefined = scanner.tryParse(DocTagNameSyntax.tryParseSyntaxElement);
        if (!tagName) {
            return undefined;
        }

        if (!Token.isWhitespaceCharacter(scanner.token()) &&
            !Token.isLineEnding(scanner.token())) {
            return undefined;
        }

        if (!Token.isLineEnding(scanner.token())) {
            scanner.scanColumns(1);
        }

        const node: DocBlockTag = new DocBlockTag({ pos, tagName });
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
    export function tryContinueBlock(parser: BlockParser, block: DocBlockTag): boolean {
        return true;
    }

    /**
     * Finishes the current block, performing any necessary block-level post-processing.
     * @param parser The parser used to parse the Block.
     * @param block The Block to finish.
     */
    export function finishBlock(parser: BlockParser, block: DocBlockTag): void {
        // DocBlockTags have no finish behavior.
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: DocBlockTag): void {
        writer.writeContents(node);
    }
}
