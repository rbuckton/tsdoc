import { SyntaxKind } from "./SyntaxKind";
import { MarkdownLinkLabel } from "./MarkdownLinkLabel";
import { MarkdownLinkDestination } from "./MarkdownLinkDestination";
import { MarkdownLinkTitle } from "./MarkdownLinkTitle";
import { SyntaxElement } from "./SyntaxElement";
import { Block, IBlockParameters } from "./Block";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { MarkdownLinkReferenceSyntax } from "../syntax/commonmark/inline/MarkdownLinkReferenceSyntax";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { BlockSiblingMixin } from "./mixins/BlockSiblingMixin";

export interface IMarkdownLinkReferenceParameters extends IBlockParameters {
    label?: MarkdownLinkLabel | string;
    destination?: MarkdownLinkDestination | string;
    title?: MarkdownLinkTitle | string;
}

export class MarkdownLinkReference extends mixin(Block, [
    BlockChildMixin,
    BlockSiblingMixin,
]) {
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
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownLinkReference {
        return SyntaxKind.MarkdownLinkReference;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<MarkdownLinkReference> {
        return MarkdownLinkReferenceSyntax;
    }

    /**
     * Gets or sets the label for the reference.
     */
    public get label(): string {
        return this._labelSyntax.text;
    }

    public set label(value: string) {
        this._labelSyntax.text = value;
    }

    /**
     * Gets or sets the destination for the reference.
     */
    public get destination(): string {
        return this._destinationSyntax.text;
    }

    public set destination(value: string) {
        this._destinationSyntax.text = value;
    }

    /**
     * Gets or sets the title for the reference.
     */
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

    /**
     * {@inheritDoc Node.getSyntaxElements()}
     * @override
     */
    public getSyntaxElements(): ReadonlyArray<SyntaxElement> {
        const syntax: SyntaxElement[] = [
            this._labelSyntax,
            this._destinationSyntax
        ];
        if (this._titleSyntax) {
            syntax.push(this._titleSyntax);
        }
        return syntax;
    }
}
