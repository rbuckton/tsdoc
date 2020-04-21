import { SyntaxKind } from "./SyntaxKind";
import { INodeParameters } from "./Node";
import { Block } from "./Block";
import { IParserState } from "../ParserBase";
import { TSDocPrinter } from "../TSDocPrinter";

export interface IMarkdownHtmlBlockParameters extends INodeParameters {
    html?: string;
}

export class MarkdownHtmlBlock extends Block {
    private _html: string | undefined;

    public constructor(parameters?: IMarkdownHtmlBlockParameters) {
        super(parameters);
        this._html = parameters && parameters.html;
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownHtmlBlock {
        return SyntaxKind.MarkdownHtmlBlock;
    }

    public get html(): string {
        const state: IParserState | undefined = this.getParserState();
        return (state ? state.literal : this._html) || "";
    }

    public set html(value: string) {
        if (this.html !== value) {
            this.beforeChange();
            this._html = value;
            this.afterChange();
        }
    }

    /** @override */
    protected applyParserState(state: IParserState): void {
        this._html = state.literal;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.write(this.html);
        printer.writeln();
    }
}