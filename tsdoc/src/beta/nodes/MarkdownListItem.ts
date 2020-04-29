import { SyntaxKind } from "./SyntaxKind";
import { ListItemBase, IListItemBaseParameters, IListMarker } from "./ListItemBase";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { Token } from "../parser/Token";
import { StringUtils } from "../parser/utils/StringUtils";
import { Node } from "./Node";
import { MarkdownList } from "./MarkdownList";

export interface IOrderedListMarker extends IListMarker {
    readonly ordered: true;
    readonly bulletToken: Token.OrderedListItemBullet;
    readonly start: number;
}

export interface IUnorderedListMarker extends IListMarker {
    readonly ordered: false;
    readonly bulletToken: Token.UnorderedListItemBullet;
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

    public get kind(): SyntaxKind.MarkdownListItem {
        return SyntaxKind.MarkdownListItem;
    }

    public get listMarker(): ListMarker {
        return this.getListMarker() as ListMarker;
    }

    public set listMarker(value: ListMarker) {
        this.setListMarker(value);
    }

    /**
     * Gets the parent of this node, if that parent is a `MarkdownList`.
     */
    public get parentMarkdownList(): MarkdownList | undefined {
        return this.parent instanceof MarkdownList ? this.parent : undefined;
    }

    /**
     * Gets the previous sibling of this node, if that sibling is a `MarkdownListItem`.
     */
    public get previousSiblingMarkdownListItem(): MarkdownListItem | undefined {
        return this.previousSibling instanceof MarkdownListItem ? this.previousSibling : undefined;
    }

    /**
     * Gets the next sibling of this node, if that sibling is a `MarkdownListItem`.
     */
    public get nextSiblingMarkdownListItem(): MarkdownListItem | undefined {
        return this.nextSibling instanceof MarkdownListItem ? this.nextSibling : undefined;
    }

    /** @override */
    public canHaveParent(node: Node): boolean {
        return node instanceof MarkdownList;
    }

    /** @override */
    protected setListMarker(value: IListMarker): void {
        super.setListMarker(value);
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        const bullet: string = this.listMarker.ordered ?
            `${this.listMarker.start}${this.listMarker.bulletToken === Token.CloseParenToken ? ')' : '.'}` :
            `${this.listMarker.bulletToken === Token.MinusToken ? `-` : '*'}`;
        printer.pushBlock({
            indent: this.listMarker.markerOffset,
            firstLinePrefix: `${bullet}${StringUtils.repeat(' ', this.listMarker.padding - bullet.length)}`,
            linePrefix: StringUtils.repeat(' ', this.listMarker.padding)
        });
        this.printChildren(printer);
        printer.popBlock();
    }
}