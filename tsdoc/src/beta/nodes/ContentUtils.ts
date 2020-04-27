import { Content } from "./Content";
import { Inline, IInlineContainer, IInlineContainerParameters } from "./Inline";
import { Run } from "./Run";
import { Block, IBlockContainer, IBlockContainerParameters } from "./Block";
import { MarkdownParagraph } from "./MarkdownParagraph";
import { ListMarker, ListItemBase, IListItemContainer, IListItemContainerParameters } from "./ListItemBase";
import { Token } from "../parser/Token";
import { MarkdownListItem } from "./MarkdownListItem";
import { MarkdownList } from "./MarkdownList";

export namespace ContentUtils {
    export function appendContent(node: Content & IBlockContainer, content: IBlockContainerParameters["content"]): boolean;
    export function appendContent(node: Content & IListItemContainer, content: IListItemContainerParameters["content"]): boolean;
    export function appendContent(node: Content & IInlineContainer, content: IInlineContainerParameters["content"]): boolean;
    export function appendContent(node: Content, content: string | Inline | Block | ListItemBase | ReadonlyArray<string | Inline | Block | ListItemBase> | undefined): boolean {
        return appendContentWorker(node, content);
    }

    function getDefaultListMarker(): ListMarker {
        return {
            ordered: false,
            bulletToken: Token.MinusToken,
            markerOffset: 0,
            padding: 2,
            tight: true
        };
    }

    function appendContentWorker(node: Content, content: string | Inline | Block | ListItemBase | ReadonlyArray<string | Inline | Block | ListItemBase> | undefined): boolean {
        if (content === undefined) {
            return false;
        }
        if (typeof content === 'string') {
            return appendContentWorker(node, new Run({ text: content }));
        }
        if ((Array.isArray as (array: any) => array is readonly unknown[])(content)) {
            let appendedAny: boolean = false;
            for (const item of content) {
                if (appendContentWorker(node, item)) {
                    appendedAny = true;
                }
            }
            return appendedAny;
        }
        for (;;) {
            if (node.appendChild(content)) {
                return true;
            }
            if (content.isInline()) {
                if (node.isBlockContainer() || node.isListItemContainer()) {
                    content = new MarkdownParagraph({ content });
                    continue;
                }
            }
            if (content.isListItem()) {
                if (node.isBlockContainer()) {
                    content = new MarkdownList({ content });
                    continue;
                }
            }
            if (node.isListItemContainer()) {
                const listMarker: ListMarker = node.firstChildListItem && node.firstChildListItem.listMarker || getDefaultListMarker();
                content = new MarkdownListItem({ listMarker, content });
                continue;
            }
            return false;
        }
    }
}
