import { StartResult, ContinueResult } from "./IBlockSyntaxParser";
import { BlockParser } from "../BlockParser";
import { SyntaxKind } from "../nodes/SyntaxKind";
import { Node } from "../nodes/Node";
import { MarkdownList } from "../nodes/MarkdownList";
import { MarkdownListItem } from "../nodes/MarkdownListItem";
import { Block } from "../nodes/Block";

export namespace MarkdownListParser {
    export const kind: SyntaxKind.MarkdownList = SyntaxKind.MarkdownList;

    export function tryStart(_parser: BlockParser, _container: Node): StartResult {
        // Lists are started by list items.
        return StartResult.Unmatched;
    }

    export function tryContinue(_parser: BlockParser, _block: MarkdownList): ContinueResult {
        // Lists are always continued.
        return ContinueResult.Matched;
    }

    export function finish(parser: BlockParser, block: MarkdownList): void {
        let item: Node | undefined = block.firstChild;
        while (item instanceof MarkdownListItem) {
            // check for non-final list item ending with blank line:
            if (parser.endsWithBlankLine(item) && item.nextSibling) {
                block.listMarker.tight = false;
                break;
            }

            // recurse into children of list item, to see if there are
            // spaces between any of them:
            let child: Node | undefined = item.firstChild;
            while (child instanceof Block) {
                if (parser.endsWithBlankLine(child) && (item.nextSibling || child.nextSibling)) {
                    block.listMarker.tight = false;
                    break;
                }
                child = child.nextSibling;
            }
            item = item.nextSibling;
        }
    }
}
