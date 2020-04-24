import { SyntaxKind } from "./SyntaxKind";
import { Syntax, ISyntaxParameters } from "./Syntax";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IMarkdownLinkDestinationParameters extends ISyntaxParameters {
    href?: string;
    bracketed?: boolean;
}

export class MarkdownLinkDestination extends Syntax {
    private _href: string | undefined;
    private _bracketed: boolean | undefined;

    public constructor(parameters?: IMarkdownLinkDestinationParameters) {
        super(parameters);
        this._href = parameters && parameters.href;
        this._bracketed = parameters && parameters.bracketed;
    }

    public get kind(): SyntaxKind.MarkdownLinkDestination {
        return SyntaxKind.MarkdownLinkDestination;
    }

    public get href(): string {
        return this._href || '';
    }

    public set href(value: string) {
        if (this.href !== value) {
            this.beforeChange();
            this._href = value;
            this.afterChange();
        }
    }

    public get bracketed(): boolean {
        return this._bracketed || false;
    }

    public set bracketed(value: boolean) {
        if (this.bracketed !== value) {
            this.beforeChange();
            this._bracketed = value;
            this.afterChange();
        }
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.write(this.href);
    }
}
