import { SyntaxKind } from "./SyntaxKind";
import { ListItemBase, IListItemBaseParameters } from "./ListItemBase";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { Token } from "../parser/Token";
import { StringUtils } from "../parser/utils/StringUtils";

export interface IMarkdownListItemParameters extends IListItemBaseParameters {
}

export class MarkdownListItem extends ListItemBase {
    public constructor(parameters: IMarkdownListItemParameters) {
        super(parameters);
    }

    public get kind(): SyntaxKind.MarkdownListItem {
        return SyntaxKind.MarkdownListItem;
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