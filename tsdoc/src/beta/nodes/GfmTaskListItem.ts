import { SyntaxKind } from "./SyntaxKind";
import { ListItemBase, IListItemBaseParameters, IListMarker } from "./ListItemBase";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { Node } from "./Node";
import { GfmTaskList } from "./GfmTaskList";
import { Token } from "../parser/Token";

export interface IGfmTaskListMarker extends IListMarker {
    readonly task: true;
    readonly bulletToken: Token.UnorderedListItemBullet;
    readonly checked: boolean;
}

export interface IGfmTaskListItemParameters extends IListItemBaseParameters {
    listMarker: IGfmTaskListMarker;
}

export class GfmTaskListItem extends ListItemBase {
    public constructor(parameters: IGfmTaskListItemParameters) {
        super(parameters);
    }

    public get kind(): SyntaxKind.GfmTaskListItem {
        return SyntaxKind.GfmTaskListItem;
    }

    public get listMarker(): IGfmTaskListMarker {
        return this.getListMarker() as IGfmTaskListMarker;
    }

    public set listMarker(value: IGfmTaskListMarker) {
        this.setListMarker(value);
    }

    /**
     * Gets the parent of this node, if that parent is a `GfmTaskList`.
     */
    public get parentGfmTaskList(): GfmTaskList | undefined {
        return this.parent instanceof GfmTaskList ? this.parent : undefined;
    }

    /**
     * Gets the previous sibling of this node, if that sibling is a `GfmTaskListItem`.
     */
    public get previousSiblingGfmTaskListItem(): GfmTaskListItem | undefined {
        return this.previousSibling instanceof GfmTaskListItem ? this.previousSibling : undefined;
    }

    /**
     * Gets the next sibling of this node, if that sibling is a `GfmTaskListItem`.
     */
    public get nextSiblingGfmTaskListItem(): GfmTaskListItem | undefined {
        return this.nextSibling instanceof GfmTaskListItem ? this.nextSibling : undefined;
    }

    /** @override */
    public canHaveParent(node: Node): boolean {
        return node instanceof GfmTaskList;
    }

    /** @override */
    protected setListMarker(value: IListMarker): void {
        super.setListMarker(value);
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        // const bullet: string = this.listMarker.ordered ?
        //     `${this.listMarker.start}${this.listMarker.bulletToken === Token.CloseParenToken ? ')' : '.'}` :
        //     `${this.listMarker.bulletToken === Token.MinusToken ? `-` : '*'}`;
        // printer.pushBlock({
        //     indent: this.listMarker.markerOffset,
        //     firstLinePrefix: `${bullet}${StringUtils.repeat(' ', this.listMarker.padding - bullet.length)}`,
        //     linePrefix: StringUtils.repeat(' ', this.listMarker.padding)
        // });
        // this.printChildren(printer);
        // printer.popBlock();
    }
}