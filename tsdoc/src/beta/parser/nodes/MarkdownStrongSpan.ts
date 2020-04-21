import { SyntaxKind } from "./SyntaxKind";
import { Inline, IInlineParameters } from "./Inline";
import { Token } from "../Token";
import { TSDocPrinter } from "../TSDocPrinter";

export interface IMarkdownStrongSpanParameters extends IInlineParameters {
    emphasisToken?: Token.EmphasisToken;
}

export class MarkdownStrongSpan extends Inline {
    private _emphasisToken: Token.EmphasisToken | undefined;

    public constructor(parameters?: IMarkdownStrongSpanParameters) {
        super(parameters);
        this._emphasisToken = parameters && parameters.emphasisToken;
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownStrongSpan {
        return SyntaxKind.MarkdownStrongSpan;
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
        printer.write(this.emphasisToken === Token.AsteriskEmphasisToken ? '**' : '__');
        this.printChildren(printer);
        printer.write(this.emphasisToken === Token.AsteriskEmphasisToken ? '**' : '__');
    }
}
