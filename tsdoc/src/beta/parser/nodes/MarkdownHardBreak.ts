import { Inline, IInlineParameters } from "./Inline";
import { SyntaxKind } from "./SyntaxKind";
import { Token } from "../Token";
import { TSDocPrinter } from "../TSDocPrinter";

export interface IMarkdownHardBreakParameters extends IInlineParameters {
    breakToken?: Token.HardBreakToken;
}

export class MarkdownHardBreak extends Inline {
    private _breakToken: Token.HardBreakToken | undefined;

    public constructor(parameters?: IMarkdownHardBreakParameters) {
        super(parameters);
        this._breakToken = parameters && parameters.breakToken;
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownHardBreak {
        return SyntaxKind.MarkdownHardBreak;
    }

    public get breakToken(): Token.HardBreakToken {
        return this._breakToken || Token.SpaceSpaceHardBreakToken;
    }

    public set breakToken(value: Token.HardBreakToken) {
        if (!Token.isHardBreakToken(value)) throw new RangeError("Argument out of range: value");
        if (this.breakToken !== value) {
            this.beforeChange();
            this._breakToken = value;
            this.afterChange();
        }
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.write(this.breakToken === Token.SpaceSpaceHardBreakToken ? '  ' : '\\');
        printer.writeln();
    }
}