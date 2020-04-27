import { SyntaxKind } from "./SyntaxKind";
import { Inline, IInlineParameters, IInlineContainer, IInlineContainerParameters } from "./Inline";
import { Token } from "../parser/Token";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { ContentUtils } from "./ContentUtils";

export interface IMarkdownStrongSpanParameters extends IInlineParameters, IInlineContainerParameters {
    emphasisToken?: Token.EmphasisToken;
}

export class MarkdownStrongSpan extends Inline implements IInlineContainer {
    private _emphasisToken: Token.EmphasisToken | undefined;

    public constructor(parameters?: IMarkdownStrongSpanParameters) {
        super(parameters);
        this._emphasisToken = parameters && parameters.emphasisToken;
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownStrongSpan {
        return SyntaxKind.MarkdownStrongSpan;
    }

    public get emphasisToken(): Token.EmphasisToken {
        return this._emphasisToken || Token.AsteriskEmphasisToken;
    }

    public set emphasisToken(value: Token.EmphasisToken) {
        if (!Token.isEmphasisToken(value)) throw new RangeError('Argument out of range: value');
        if (this._emphasisToken !== value) {
            this.beforeChange();
            this._emphasisToken = value;
            this.afterChange();
        }
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
