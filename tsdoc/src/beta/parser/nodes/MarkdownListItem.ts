import { SyntaxKind } from "./SyntaxKind";
import { ListItemBase, IListItemBaseParameters } from "./ListItemBase";
import { ListMarker } from "./MarkdownList";
import { TSDocPrinter } from "../TSDocPrinter";
import { Token } from "../Token";
import { StringUtils } from "../utils/StringUtils";

export interface IMarkdownListItemParameters extends IListItemBaseParameters {
    readonly listMarker: ListMarker;
}

export class MarkdownListItem extends ListItemBase {
    private _listMarker: ListMarker;

    public constructor(parameters: IMarkdownListItemParameters) {
        super(parameters);
        this._listMarker = parameters.listMarker;
    }

    public get kind(): SyntaxKind.MarkdownListItem {
        return SyntaxKind.MarkdownListItem;
    }

    public get listMarker(): ListMarker {
        return this._listMarker;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        const bullet: string = this._listMarker.ordered ?
            `${this._listMarker.start}${this._listMarker.bulletToken === Token.CloseParenToken ? ')' : '.'}` :
            `${this._listMarker.bulletToken === Token.MinusToken ? `-` : '*'}`;
        printer.pushBlock({
            indent: this._listMarker.markerOffset,
            firstLinePrefix: `${bullet}${StringUtils.repeat(' ', this._listMarker.padding - bullet.length)}`,
            linePrefix: StringUtils.repeat(' ', this._listMarker.padding)
        });
        this.printChildren(printer);
        printer.popBlock();
    }
}