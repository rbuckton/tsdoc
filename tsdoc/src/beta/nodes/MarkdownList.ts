import { SyntaxKind } from "./SyntaxKind";
import { ListBase, IListBaseParameters } from "./ListBase";
import { Node } from "./Node";
import { MarkdownListItem } from "./MarkdownListItem";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { MarkdownListSyntax } from "../syntax/commonmark/block/MarkdownListSyntax";
import { ListItemBase } from "./ListItemBase";

export interface IMarkdownListParameters extends IListBaseParameters {
}

export class MarkdownList extends ListBase {
    public constructor(parameters?: IMarkdownListParameters) {
        super(parameters);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownList {
        return SyntaxKind.MarkdownList;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<MarkdownList> {
        return MarkdownListSyntax;
    }

    /**
     * Gets the first child of this node, if that child is a {@link MarkdownListItem}.
     */
    public get firstChildMarkdownListItem(): MarkdownListItem | undefined {
        const firstChild: ListItemBase | undefined = this.firstChildListItem;
        return firstChild && firstChild.kind === SyntaxKind.MarkdownListItem ? firstChild as MarkdownListItem : undefined;
    }

    /**
     * Gets the last child of this node, if that child is a {@link MarkdownListItem}.
     */
    public get lastChildMarkdownListItem(): MarkdownListItem | undefined {
        const lastChild: ListItemBase | undefined = this.lastChildListItem;
        return lastChild && lastChild.kind === SyntaxKind.MarkdownListItem ? lastChild as MarkdownListItem : undefined;
    }

    /**
     * {@inheritDoc Node.canHaveChild()}
     * @override
     */
    public canHaveChild(node: Node): boolean {
        return node.kind === SyntaxKind.MarkdownListItem;
    }
}
