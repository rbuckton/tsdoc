import { Inline } from "./Inline";
import { SyntaxKind } from "./SyntaxKind";
import { INodeParameters } from "./Node";
import { Token } from "../parser/Token";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IMarkdownAutoLinkParameters extends INodeParameters {
    destination?: string;
    linkToken?: Token.AbsoluteUri | Token.EmailAddress;
}

export class MarkdownAutoLink extends Inline {
    private _destination: string | undefined;
    private _linkToken: Token.AbsoluteUri | Token.EmailAddress;

    public constructor(parameters?: IMarkdownAutoLinkParameters) {
        super(parameters);
        this._destination = parameters && parameters.destination;
        this._linkToken = parameters && parameters.linkToken || Token.AbsoluteUri;
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownAutoLink {
        return SyntaxKind.MarkdownAutoLink;
    }

    public get linkToken(): Token.AbsoluteUri | Token.EmailAddress {
        return this._linkToken;
    }

    public get destination(): string {
        return this._destination || "";
    }

    public set destination(value: string) {
        if (this._destination !== value) {
            this.beforeChange();
            this._destination = value;
            this.afterChange();
        }
    }

    public get href(): string {
        return this._linkToken === Token.AbsoluteUri ? encodeURI(this.destination) : 'mailto:' + encodeURI(this.destination);
    }

    public get text(): string {
        return this.destination;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.write('<');
        printer.write(this.destination);
        printer.write('>');
    }
}