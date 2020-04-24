import { Inline, IInlineParameters } from "./Inline";
import { MarkdownLinkDestination } from "./MarkdownLinkDestination";
import { MarkdownLinkTitle } from "./MarkdownLinkTitle";
import { MarkdownLinkLabel } from "./MarkdownLinkLabel";
import { Syntax } from "./Syntax";
import { Node } from "./Node";
import { MarkdownUtils } from "../parser/utils/MarkdownUtils";
import { MarkdownLinkReference } from "./MarkdownLinkReference";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface ILinkBaseParameters extends IInlineParameters {
    destination?: MarkdownLinkDestination | string;
    title?: MarkdownLinkTitle | string;
    label?: MarkdownLinkLabel | string;
}

export abstract class LinkBase extends Inline {
    private _destinationSyntax: MarkdownLinkDestination | undefined;
    private _titleSyntax: MarkdownLinkTitle | undefined;
    private _labelSyntax: MarkdownLinkLabel | undefined;
    private _resolvedReference: MarkdownLinkReference | undefined;
    private _documentVersion: number = -1;

    public constructor(parameters: ILinkBaseParameters = {}) {
        super(parameters);
        if (parameters.destination !== undefined && parameters.label !== undefined) {
            throw new Error('A link cannot specify both a destination and a label');
        }
        if (parameters.title !== undefined && parameters.label !== undefined) {
            throw new Error('A link cannot specify both a title and a label');
        }
        this.attachSyntax(this._destinationSyntax =
            parameters.destination instanceof MarkdownLinkDestination ? parameters.destination :
            parameters.destination !== undefined ? new MarkdownLinkDestination({ href: parameters.destination }) :
            undefined);
        this.attachSyntax(this._titleSyntax =
            parameters.title instanceof MarkdownLinkTitle ? parameters.title :
            parameters.title !== undefined ? new MarkdownLinkTitle({ text: parameters.title }) :
            undefined);
        this.attachSyntax(this._labelSyntax =
            parameters.label instanceof MarkdownLinkLabel ? parameters.label :
            parameters.label !== undefined ? new MarkdownLinkLabel({ text: parameters.label }) :
            undefined);
    }

    public get destination(): string {
        if (this._destinationSyntax) return this._destinationSyntax.href;
        const linkReference: MarkdownLinkReference | undefined = this._resolveLinkReference();
        return linkReference ? linkReference.destination : "";
    }

    public set destination(value: string) {
        this._applyLinkReference();
        this._ensureDestinationSyntax().href = value;
    }

    public get title(): string | undefined {
        if (this._titleSyntax) return this._titleSyntax.text;
        const linkReference: MarkdownLinkReference | undefined = this._resolveLinkReference();
        return linkReference ? linkReference.title : undefined;
    }

    public set title(value: string | undefined) {
        this._applyLinkReference();
        if (value === undefined) {
            const titleSyntax: MarkdownLinkTitle | undefined = this._titleSyntax;
            if (titleSyntax) {
                this._titleSyntax = undefined;
                this.detachSyntax(titleSyntax);
            }
        } else {
            this._ensureTitleSyntax().text = value;
        }
    }

    public get label(): string | undefined {
        return this._labelSyntax ? this._labelSyntax.text : undefined;
    }

    public set label(value: string | undefined) {
        if (value === undefined) {
            const labelSyntax: MarkdownLinkLabel | undefined = this._labelSyntax;
            if (labelSyntax) {
                this._labelSyntax = undefined;
                this.detachSyntax(labelSyntax);
            }
        } else {
            this._ensureLabelSyntax().text = value;
        }
        this._maybeInvalidateResolvedReference();
    }

    /** @override */
    public isInlineContainer(): true {
        return true;
    }

    /** @override */
    public isLink(): true {
        return true;
    }

    /**
     * Iterates through each syntactic and content element of this node.
     * @param cb The callback to execute for each node. If the callback returns a value other than `undefined`, iteration
     * stops and that value is returned.
     *
     * @override
     */
    public forEachNode<A extends any[], T>(cb: (node: Node, ...args: A) => T | undefined, ...args: A): T | undefined {
        // inline content comes before other syntax
        return this.forEachChild(cb, ...args)
            || this.forEachSyntax(cb, ...args);
    }

    /** @override */
    public getSyntax(): ReadonlyArray<Syntax> {
        const syntax: Syntax[] = [];
        if (this._destinationSyntax || this._titleSyntax) {
            if (this._destinationSyntax) syntax.push(this._destinationSyntax);
            if (this._titleSyntax) syntax.push(this._titleSyntax);
        } else if (this._labelSyntax) {
            syntax.push(this._labelSyntax);
        }
        return syntax;
    }

    private _ensureDestinationSyntax(): MarkdownLinkDestination {
        this._applyLinkReference();
        if (!this._destinationSyntax) {
            const labelSyntax: MarkdownLinkLabel | undefined = this._labelSyntax;
            this._labelSyntax = undefined;
            this.detachSyntax(labelSyntax);
            this.attachSyntax(this._destinationSyntax = new MarkdownLinkDestination());
        }
        return this._destinationSyntax;
    }

    private _ensureTitleSyntax(): MarkdownLinkTitle {
        this._applyLinkReference();
        if (!this._titleSyntax) {
            const labelSyntax: MarkdownLinkLabel | undefined = this._labelSyntax;
            this._labelSyntax = undefined;
            this.detachSyntax(labelSyntax);
            this.attachSyntax(this._titleSyntax = new MarkdownLinkTitle());
        }
        return this._titleSyntax;
    }

    private _ensureLabelSyntax(): MarkdownLinkLabel {
        if (!this._labelSyntax) {
            const destinationSyntax: MarkdownLinkDestination | undefined = this._destinationSyntax;
            this._destinationSyntax = undefined;
            this.detachSyntax(destinationSyntax);
            const titleSyntax: MarkdownLinkTitle | undefined = this._titleSyntax;
            this._titleSyntax = undefined;
            this.detachSyntax(titleSyntax);
            this.attachSyntax(this._labelSyntax = new MarkdownLinkLabel());
        }
        return this._labelSyntax;
    }

    private _maybeInvalidateResolvedReference(): void {
        if (this._resolvedReference && (!this.ownerDocument || !this._labelSyntax || Node.getVersion(this.ownerDocument) !== this._documentVersion)) {
            this._resolvedReference = undefined;
            this._documentVersion = -1;
        }
    }

    private _resolveLinkReference(): MarkdownLinkReference | undefined {
        this._maybeInvalidateResolvedReference();
        if (!this._resolvedReference && this.ownerDocument) {
            let refLabel: string | undefined;
            if (this.label) {
                refLabel = MarkdownUtils.normalizeLinkReference(this.label);
            }
            if (refLabel) {
                const linkReference: MarkdownLinkReference | undefined = this.ownerDocument.referenceMap.get(refLabel);
                if (linkReference) {
                    this._resolvedReference = linkReference;
                    this._documentVersion = Node.getVersion(this.ownerDocument);
                }
            }
        }
        return this._resolvedReference;
    }

    private _applyLinkReference(): void {
        const linkReference: MarkdownLinkReference | undefined = this._resolveLinkReference();
        if (linkReference) {
            this._ensureDestinationSyntax().href = linkReference.destination;
            if (linkReference.title !== undefined) {
                this._ensureTitleSyntax().text = linkReference.title;
            }
            this._labelSyntax = undefined;
            this._maybeInvalidateResolvedReference();
        }
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        this.printLinkContent(printer);
        if (this._destinationSyntax) {
            printer.write('(');
            this.printNode(printer, this._destinationSyntax);
            if (this._titleSyntax) {
                printer.write(' ');
                this.printNode(printer, this._titleSyntax);
            }
            printer.write(')');
        } else if (this._labelSyntax) {
            this.printNode(printer, this._labelSyntax);
        }
    }

    protected abstract printLinkContent(printer: TSDocPrinter): void;
}
