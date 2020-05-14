import { SyntaxKind } from "./SyntaxKind";
import { ListItemBase, IListItemBaseParameters, IListMarker } from "./ListItemBase";
import { Node } from "./Node";
import { MarkdownList } from "./MarkdownList";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { MarkdownListItemSyntax } from "../syntax/commonmark/block/MarkdownListItemSyntax";
import { ListBase } from "./ListBase";

export interface IOrderedListMarker extends IListMarker {
    readonly ordered: true;
    readonly bullet: '.' | ')';
    readonly start: number;
}

export interface IUnorderedListMarker extends IListMarker {
    readonly ordered: false;
    readonly bullet: '*' | '+' | '-';
}

export type ListMarker =
    | IOrderedListMarker
    | IUnorderedListMarker
    ;

export interface IMarkdownListItemParameters extends IListItemBaseParameters {
    listMarker: ListMarker;
}

export class MarkdownListItem extends ListItemBase {
    public constructor(parameters: IMarkdownListItemParameters) {
        super(parameters);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownListItem {
        return SyntaxKind.MarkdownListItem;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<MarkdownListItem> {
        return MarkdownListItemSyntax;
    }

    /**
     * {@inheritDoc ListItemBase.listMarker}
     * @override
     */
    public get listMarker(): ListMarker {
        return this.getListMarker() as ListMarker;
    }
    
    /**
     * {@inheritDoc ListItemBase.listMarker}
     * @override
     */
    public set listMarker(value: ListMarker) {
        this.setListMarker(value);
    }

    /**
     * Gets the parent of this node, if that parent is a {@link MarkdownList}.
     */
    public get parentMarkdownList(): MarkdownList | undefined {
        const parentList: ListBase | undefined = this.parentList;
        return parentList && parentList.kind === SyntaxKind.MarkdownList ? parentList as MarkdownList : undefined;
    }

    /**
     * Gets the previous sibling of this node, if that sibling is a {@link MarkdownListItem}.
     */
    public get previousSiblingMarkdownListItem(): MarkdownListItem | undefined {
        const previousSibling: ListItemBase | undefined = this.previousSiblingListItem;
        return previousSibling && previousSibling.kind === SyntaxKind.MarkdownListItem ? previousSibling as MarkdownListItem : undefined;
    }

    /**
     * Gets the next sibling of this node, if that sibling is a {@link MarkdownListItem}.
     */
    public get nextSiblingMarkdownListItem(): MarkdownListItem | undefined {
        const nextSibling: ListItemBase | undefined = this.nextSiblingListItem;
        return nextSibling && nextSibling.kind === SyntaxKind.MarkdownListItem ? nextSibling as MarkdownListItem : undefined;
    }

    /**
     * {@inheritDoc Node.canHaveParent()}
     * @override
     */
    public canHaveParent(node: Node): boolean {
        return node.kind === SyntaxKind.MarkdownList;
    }

    /**
     * {@inheritDoc ListItemBase.setListMarker}
     * @override
     */
    protected setListMarker(value: IListMarker): void {
        super.setListMarker(value);
    }
}