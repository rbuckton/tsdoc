import { SyntaxKind } from "./SyntaxKind";
import { MarkdownLinkLabel } from "./MarkdownLinkLabel";
import { MarkdownLinkDestination } from "./MarkdownLinkDestination";
import { MarkdownLinkTitle, MarkdownLinkTitleQuoteStyle } from "./MarkdownLinkTitle";
import { Syntax } from "./Syntax";
import { Block, IBlockParameters } from "./Block";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IMarkdownLinkReferenceParameters extends IBlockParameters {
    label?: MarkdownLinkLabel;
    destination?: MarkdownLinkDestination;
    title?: MarkdownLinkTitle | undefined;
}

export class MarkdownLinkReference extends Block {
    private _label: MarkdownLinkLabel | undefined;
    private _destination: MarkdownLinkDestination | undefined;
    private _title: MarkdownLinkTitle | undefined;

    public constructor(parameters?: IMarkdownLinkReferenceParameters) {
        super(parameters);
        this.attachSyntax(this._label = parameters && parameters.label);
        this.attachSyntax(this._destination = parameters && parameters.destination);
        this.attachSyntax(this._title = parameters && parameters.title);
    }

    /**
     * @override
     */
    public get kind(): SyntaxKind.MarkdownLinkReference {
        return SyntaxKind.MarkdownLinkReference;
    }

    public get labelSyntax(): MarkdownLinkLabel {
        if (!this._label) {
            this.attachSyntax(this._label = new MarkdownLinkLabel());
        }
        return this._label;
    }

    public get destinationSyntax(): MarkdownLinkDestination {
        if (!this._destination) {
            this.attachSyntax(this._destination = new MarkdownLinkDestination());
        }
        return this._destination;
    }

    public get titleSyntax(): MarkdownLinkTitle | undefined {
        return this._title;
    }

    public get label(): string {
        return this.labelSyntax.text;
    }

    public set label(value: string) {
        this.labelSyntax.text = value;
    }

    public get href(): string {
        return this.destinationSyntax.href;
    }

    public set href(value: string) {
        this.destinationSyntax.href = value;
    }

    public get title(): string | undefined {
        return this._title && this._title.text;
    }

    public set title(value: string | undefined) {
        if (this.title !== value) {
            if (value === undefined) {
                if (this._title) {
                    const title: MarkdownLinkTitle = this._title;
                    this._title = undefined;
                    this.detachSyntax(title);
                }
            } else {
                if (this._title) {
                    this._title.text = value;
                } else {
                    this.attachSyntax(this._title = new MarkdownLinkTitle({ text: value }));
                }
            }
        }
    }

    /** @override */
    protected getSyntax(): ReadonlyArray<Syntax | undefined> {
        return [
            this.labelSyntax,
            this.destinationSyntax,
            this.titleSyntax
        ];
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.write('[');
        printer.write(this.label);
        printer.write(']: ');
        printer.write(this.href);
        if (this.titleSyntax) {
            printer.write(' ');
            printer.write(this.titleSyntax.quoteStyle === MarkdownLinkTitleQuoteStyle.DoubleQuote ? '"' :
                this.titleSyntax.quoteStyle === MarkdownLinkTitleQuoteStyle.SingleQuote ? '\'' :
                '(');
            printer.write(this.titleSyntax.text);
            printer.write(this.titleSyntax.quoteStyle === MarkdownLinkTitleQuoteStyle.DoubleQuote ? '"' :
                this.titleSyntax.quoteStyle === MarkdownLinkTitleQuoteStyle.SingleQuote ? '\'' :
                ')');
        }
    }
}
