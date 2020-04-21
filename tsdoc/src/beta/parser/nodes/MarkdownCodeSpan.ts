import { Inline } from "./Inline";
import { SyntaxKind } from "./SyntaxKind";
import { INodeParameters } from "./Node";
import { TSDocPrinter } from "../TSDocPrinter";
import { StringUtils } from "../utils/StringUtils";

export interface IMarkdownCodeSpanParameters extends INodeParameters {
    backtickCount?: number;
    text?: string;
}

export class MarkdownCodeSpan extends Inline {
    private _backtickCount: number | undefined;
    private _text: string | undefined;

    public constructor(parameters?: IMarkdownCodeSpanParameters) {
        super(parameters);
        this._backtickCount = parameters && parameters.backtickCount;
        this._text = parameters && parameters.text;
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownCodeSpan {
        return SyntaxKind.MarkdownCodeSpan;
    }

    public get backtickCount(): number {
        return this._backtickCount || 1;
    }

    public set backtickCount(value: number) {
        if (value < 1) throw new RangeError("Argument out of range: value");
        if (this.backtickCount !== value) {
            this.beforeChange();
            this._backtickCount = value;
            this.afterChange();
        }
    }

    public get text(): string {
        return this._text || "";
    }

    public set text(value: string) {
        if (this.text !== value) {
            this.beforeChange();
            this._text = value;
            this.afterChange();
        }
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.write(StringUtils.repeat('`', this.backtickCount));
        if (this.text.indexOf('`') >= 0) {
            printer.write(' ');
            printer.write(this.text);
            printer.write(' ');
        } else {
            printer.write(this.text);
        }
        printer.write(StringUtils.repeat('`', this.backtickCount));
    }
}