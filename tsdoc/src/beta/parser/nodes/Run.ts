import { Inline } from "./Inline";
import { SyntaxKind } from "./SyntaxKind";
import { INodeParameters } from "./Node";
import { IParserState } from "../ParserBase";
import { TSDocPrinter } from "../TSDocPrinter";

export interface IRunParameters extends INodeParameters {
    text?: string;
}

export class Run extends Inline {
    private _text: string | undefined;

    public constructor(parameters?: IRunParameters) {
        super(parameters);
        this._text = parameters && parameters.text;
    }

    /** @override */
    public get kind(): SyntaxKind.Run {
        return SyntaxKind.Run;
    }

    public get text(): string {
        const state = this.getParserState();
        return (state ? state.text : this._text) || "";
    }

    public set text(value: string) {
        if (this.text !== value) {
            this.beforeChange();
            this._text = value;
            this.afterChange();
        }
    }

    /** @override */
    protected applyParserState(state: IParserState): void {
        this._text = state.text;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.writeEscaped(this.text);
    }
}
