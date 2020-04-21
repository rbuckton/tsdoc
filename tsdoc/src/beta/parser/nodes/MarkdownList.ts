import { Token } from "../Token";
import { SyntaxKind } from "./SyntaxKind";
import { ListBase, IListBaseParameters } from "./ListBase";
import { TSDocPrinter } from "../TSDocPrinter";

export interface IOrderedListMarker {
    readonly markerOffset: number;
    readonly ordered: true;
    readonly bulletToken: Token.OrderedListItemBullet;
    readonly start: number;
    tight: boolean;
    padding: number;
}

export interface IUnorderedListMarker {
    readonly markerOffset: number;
    readonly ordered: false;
    readonly bulletToken: Token.UnorderedListItemBullet;
    tight: boolean;
    padding: number;
}

export type ListMarker =
    | IOrderedListMarker
    | IUnorderedListMarker
    ;

export interface IMarkdownListParameters extends IListBaseParameters {
    readonly listMarker: ListMarker;
}

export class MarkdownList extends ListBase {
    private _listMarker: ListMarker;

    public constructor(parameters: IMarkdownListParameters) {
        super(parameters);
        this._listMarker = parameters.listMarker;
    }

    public get kind(): SyntaxKind.MarkdownList {
        return SyntaxKind.MarkdownList;
    }

    public get listMarker(): ListMarker {
        return this._listMarker;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        this.printChildren(printer);
    }
}
