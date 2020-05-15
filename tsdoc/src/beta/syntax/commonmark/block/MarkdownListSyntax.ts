import { BlockParser } from "../../../parser/BlockParser";
import { MarkdownList } from "../../../nodes/MarkdownList";
import { Block } from "../../../nodes/Block";
import { ListItemBase } from "../../../nodes/ListItemBase";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IBlockSyntax } from "../../IBlockSyntax";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { ListMarker } from "../../../nodes/MarkdownListItem";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";
import { Content } from "../../../nodes/Content";

export namespace MarkdownListSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IBlockSyntax<MarkdownList>
        & IHtmlEmittable<MarkdownList>
        & ITSDocEmittable<MarkdownList>
    >(MarkdownListSyntax);

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
    export function tryContinueBlock(parser: BlockParser, block: MarkdownList): boolean {
        // Lists are always continued.
        return true;
    }

    /**
     * Finishes the current block, performing any necessary block-level post-processing.
     * @param parser The parser used to parse the Block.
     * @param block The Block to finish.
     */
    export function finishBlock(parser: BlockParser, block: MarkdownList): void {
        let item: ListItemBase | undefined = block.firstChildListItem;
        let tight: boolean = true;
        while (item) {
            // check for non-final list item ending with blank line:
            if (parser.endsWithBlankLine(item) && item.nextSibling) {
                tight = false;
                break;
            }

            // recurse into children of list item, to see if there are
            // spaces between any of them:
            let child: Block | undefined = item.firstChildBlock;
            while (child) {
                if (parser.endsWithBlankLine(child) && (item.nextSibling || child.nextSibling)) {
                    tight = false;
                    break;
                }
                const nextSibling: Content | undefined = child.nextSibling;
                child = nextSibling && nextSibling.isBlock() ? nextSibling : undefined;
            }
            item = item.nextSiblingListItem;
        }

        item = block.firstChildListItem;
        while (item) {
            if (item.listMarker.tight !== tight) {
                item.listMarker = {...item.listMarker, tight };
            }
            item = item.nextSiblingListItem;
        }
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: MarkdownList): void {
        const listMarker: ListMarker | undefined = node.firstChildMarkdownListItem ? node.firstChildMarkdownListItem.listMarker : undefined;
        const tagname: string = listMarker && listMarker.ordered ? 'ol' : 'ul';
        const attrs: [string, string][] = [];

        const start: number | undefined = listMarker && listMarker.ordered ? listMarker.start : undefined;
        if (start !== undefined && start !== 1) {
            attrs.push(['start', start.toString()]);
        }
        writer.writeLine();
        writer.writeTag(tagname, attrs);
        writer.writeLine();
        writer.writeContents(node);
        writer.writeLine();
        writer.writeTag('/' + tagname);
        writer.writeLine();
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownList): void {
        writer.writeContents(node);
    }
}
