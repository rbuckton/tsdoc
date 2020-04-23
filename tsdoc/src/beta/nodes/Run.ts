import { Inline } from "./Inline";
import { SyntaxKind } from "./SyntaxKind";
import { INodeParameters } from "./Node";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IRunParameters extends INodeParameters {
    text?: string;
}

export class Run extends Inline {
    private _text: string;

    public constructor(parameters?: IRunParameters) {
        super(parameters);
        this._text = parameters && parameters.text !== undefined ? parameters.text : "";
    }

    /** @override */
    public get kind(): SyntaxKind.Run {
        return SyntaxKind.Run;
    }

    public get text(): string {
        return this._text;
    }
    public set text(value: string) {
        this._text = value;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.writeEscaped(this.text);
    }
}
