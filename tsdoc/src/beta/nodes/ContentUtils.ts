import { Content } from "./Content";
import { Inline, IInlineContainer, IInlineContainerParameters } from "./Inline";
import { Run } from "./Run";
import { Block, IBlockContainer, IBlockContainerParameters } from "./Block";
import { MarkdownParagraph } from "./MarkdownParagraph";
import { ListItemBase, IListItemContainer, IListItemContainerParameters } from "./ListItemBase";
import { ListMarker } from "./MarkdownListItem";
import { Token } from "../parser/Token";
import { MarkdownListItem } from "./MarkdownListItem";
import { MarkdownList } from "./MarkdownList";
import { ITableRowContainer, ITableRowContainerParameters, TableRowBase } from "./TableRowBase";
import { ITableCellContainer, ITableCellContainerParameters, TableCellBase } from "./TableCellBase";

export namespace ContentUtils {
    export function appendContent(node: Content & IBlockContainer, content: IBlockContainerParameters["content"]): boolean;
    export function appendContent(node: Content & IListItemContainer, content: IListItemContainerParameters["content"]): boolean;
    export function appendContent(node: Content & IInlineContainer, content: IInlineContainerParameters["content"]): boolean;
    export function appendContent(node: Content & ITableRowContainer, content: ITableRowContainerParameters["content"]): boolean;
    export function appendContent(node: Content & ITableCellContainer, content: ITableCellContainerParameters["content"]): boolean;
    export function appendContent(node: Content, content: string | Inline | Block | ListItemBase | TableRowBase | TableCellBase | ReadonlyArray<string | Inline | Block | ListItemBase | TableRowBase | TableCellBase> | undefined): boolean {
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
                if (node.isBlockContainer() ||
                    node.isListItemContainer()) {
                    content = new MarkdownParagraph({ content });
                    continue;
                }
                if (node.isTableRowContainer() ||
                    node.isTableCellContainer()) {
                    throw new Error("Not yet implemented.");
                }
            }
            if (content.isListItem()) {
                if (node.isBlockContainer()) {
                    content = new MarkdownList({ content });
                    continue;
                }
            }
            if (node instanceof MarkdownList) {
                const listMarker: ListMarker = node.firstChildMarkdownListItem && node.firstChildMarkdownListItem.listMarker || getDefaultListMarker();
                content = new MarkdownListItem({ listMarker, content });
                continue;
            }
            if (node.isTableRowContainer() ||
                node.isTableCellContainer()) {
                throw new Error("Not yet implemented.");
            }
            return false;
        }
    }
}
