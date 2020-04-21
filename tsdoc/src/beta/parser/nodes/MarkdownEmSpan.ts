import { SyntaxKind } from "./SyntaxKind";
import { Inline, IInlineParameters } from "./Inline";
import { Token } from "../Token";
import { TSDocPrinter } from "../TSDocPrinter";

export interface IMarkdownEmSpanParameters extends IInlineParameters {
    emphasisToken?: Token.EmphasisToken;
}

export class MarkdownEmSpan extends Inline {
    private _emphasisToken: Token.EmphasisToken | undefined;

    public constructor(parameters?: IMarkdownEmSpanParameters) {
        super(parameters);
        this._emphasisToken = parameters && parameters.emphasisToken;
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownEmSpan { 
        return SyntaxKind.MarkdownEmSpan;
    }

    public get emphasisToken(): Token.EmphasisToken {
        return this._emphasisToken || Token.AsteriskEmphasisToken;
    }

    /** @override */
    public isInlineContainer(): true {
        return true;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.write(this.emphasisToken === Token.AsteriskEmphasisToken ? '*' : '_');
        this.printChildren(printer);
        printer.write(this.emphasisToken === Token.AsteriskEmphasisToken ? '*' : '_');
    }
}