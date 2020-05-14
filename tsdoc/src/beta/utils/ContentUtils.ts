import { Content } from "../nodes/Content";
import { Inline } from "../nodes/Inline";
import { Run } from "../nodes/Run";
import { Block } from "../nodes/Block";
import { MarkdownParagraph } from "../nodes/MarkdownParagraph";
import { ListItemBase } from "../nodes/ListItemBase";
import { ListMarker } from "../nodes/MarkdownListItem";
import { MarkdownListItem } from "../nodes/MarkdownListItem";
import { MarkdownList } from "../nodes/MarkdownList";
import { TableRowBase } from "../nodes/TableRowBase";
import { TableCellBase } from "../nodes/TableCellBase";
import { IInlineContainer, IInlineContainerParameters } from "../nodes/mixins/InlineContainerMixin";
import { IBlockContainer, IBlockContainerParameters } from "../nodes/mixins/BlockContainerMixin";
import { IListItemContainer, IListItemContainerParameters } from "../nodes/mixins/ListItemContainerMixin";
import { ITableRowContainer, ITableRowContainerParameters } from "../nodes/mixins/TableRowContainerMixin";
import { ITableCellContainer, ITableCellContainerParameters } from "../nodes/mixins/TableCellContainerMixin";

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
            bullet: '-',
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
