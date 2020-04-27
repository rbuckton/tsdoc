import { SyntaxKind } from "./SyntaxKind";
import { MarkdownLinkLabel } from "./MarkdownLinkLabel";
import { MarkdownLinkDestination } from "./MarkdownLinkDestination";
import { MarkdownLinkTitle } from "./MarkdownLinkTitle";
import { Syntax } from "./Syntax";
import { Block, IBlockParameters } from "./Block";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { Node } from "./Node";

export interface IMarkdownLinkReferenceParameters extends IBlockParameters {
    label?: MarkdownLinkLabel | string;
    destination?: MarkdownLinkDestination | string;
    title?: MarkdownLinkTitle | string;
}

export class MarkdownLinkReference extends Block {
    private _labelSyntax: MarkdownLinkLabel;
    private _destinationSyntax: MarkdownLinkDestination;
    private _titleSyntax: MarkdownLinkTitle | undefined;

    public constructor(parameters: IMarkdownLinkReferenceParameters = {}) {
        super(parameters);
        this.attachSyntax(this._labelSyntax =
            parameters.label instanceof MarkdownLinkLabel ? parameters.label :
            new MarkdownLinkLabel({ text: parameters.label }));
        this.attachSyntax(this._destinationSyntax =
            parameters.destination instanceof MarkdownLinkDestination ? parameters.destination :
            new MarkdownLinkDestination({ text: parameters.destination }));
        this.attachSyntax(this._titleSyntax =
            parameters.title instanceof MarkdownLinkTitle ? parameters.title :
            parameters.title !== undefined ? new MarkdownLinkTitle({ text: parameters.title }) :
            undefined);
    }

    /**
     * @override
     */
    public get kind(): SyntaxKind.MarkdownLinkReference {
        return SyntaxKind.MarkdownLinkReference;
    }

    public get label(): string {
        return this._labelSyntax.text;
    }

    public set label(value: string) {
        this._labelSyntax.text = value;
    }

    public get destination(): string {
        return this._destinationSyntax.text;
    }

    public set destination(value: string) {
        this._destinationSyntax.text = value;
    }

    public get title(): string | undefined {
        return this._titleSyntax && this._titleSyntax.text;
    }

    public set title(value: string | undefined) {
        if (this.title !== value) {
            if (value === undefined) {
                if (this._titleSyntax) {
                    const titleSyntax: MarkdownLinkTitle = this._titleSyntax;
                    this._titleSyntax = undefined;
                    this.detachSyntax(titleSyntax);
                }
            } else {
                if (this._titleSyntax) {
                    this._titleSyntax.text = value;
                } else {
                    this.attachSyntax(this._titleSyntax = new MarkdownLinkTitle({ text: value }));
                }
            }
        }
    }

    /** @override */
    public getSyntax(): ReadonlyArray<Syntax> {
        const syntax: Syntax[] = [
            this._labelSyntax,
            this._destinationSyntax
        ];
        if (this._titleSyntax) {
            syntax.push(this._titleSyntax);
        }
        return syntax;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        Node._printNode(printer, this._labelSyntax);
        printer.write(': ');
        Node._printNode(printer, this._destinationSyntax);
        if (this._titleSyntax) {
            printer.write(' ');
            Node._printNode(printer, this._titleSyntax);
        }
    }
}
