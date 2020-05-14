import { BlockParser } from "../../../parser/BlockParser";
import { Node } from "../../../nodes/Node";
import { GfmTaskList } from "../../../nodes/GfmTaskList";
import { Block } from "../../../nodes/Block";
import { GfmTaskListItem } from "../../../nodes/GfmTaskListItem";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IBlockSyntax } from "../../IBlockSyntax";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";

export namespace GfmTaskListSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IBlockSyntax<GfmTaskList>
        & IHtmlEmittable<GfmTaskList>
        & ITSDocEmittable<GfmTaskList>
    >(GfmTaskListSyntax);

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
    export function tryStartBlock(parser: BlockParser, container: Node): Block | undefined {
        // Lists are started by list items.
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
    export function tryContinueBlock(parser: BlockParser, block: GfmTaskList): boolean {
        // Lists are always continued.
        return true;
    }

    /**
     * Finishes the current block, performing any necessary block-level post-processing.
     * @param parser The parser used to parse the Block.
     * @param block The Block to finish.
     */
    export function finishBlock(parser: BlockParser, block: GfmTaskList): void {
        let item: GfmTaskListItem | undefined = block.firstChildGfmTaskListItem;
        let tight: boolean = true;
        while (item) {
            // check for non-final list item ending with blank line:
            if (parser.endsWithBlankLine(item) && item.nextSibling) {
                tight = false;
                break;
            }

            // recurse into children of list item, to see if there are
            // spaces between any of them:
            let child: Node | undefined = item.firstChild;
            while (child instanceof Block) {
                if (parser.endsWithBlankLine(child) && (item.nextSibling || child.nextSibling)) {
                    tight = false;
                    break;
                }
                child = child.nextSibling;
            }
            item = item.nextSiblingGfmTaskListItem;
        }

        item = block.firstChildGfmTaskListItem;
        while (item) {
            if (item.listMarker.tight !== tight) {
                item.listMarker = {...item.listMarker, tight };
            }
            item = item.nextSiblingGfmTaskListItem;
        }
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: GfmTaskList): void {
        const attrs: [string, string][] = [];
        writer.writeLine();
        writer.writeTag('ul', attrs);
        writer.writeLine();
        writer.writeContents(node);
        writer.writeLine();
        writer.writeTag('/ul');
        writer.writeLine();
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: GfmTaskList): void {
        writer.writeContents(node);
    }
}
