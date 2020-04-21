import { Inline, IInlineParameters } from "./Inline";
import { MarkdownLinkDestination } from "./MarkdownLinkDestination";
import { MarkdownLinkTitle } from "./MarkdownLinkTitle";
import { MarkdownLinkLabel } from "./MarkdownLinkLabel";
import { Syntax } from "./Syntax";
import { Node } from "./Node";
import { MarkdownUtils } from "../utils/MarkdownUtils";
import { MarkdownLinkReference } from "./MarkdownLinkReference";
import { IParserState } from "../ParserBase";

export interface ILinkBaseParameters extends IInlineParameters {
    destination?: MarkdownLinkDestination;
    title?: MarkdownLinkTitle;
    label?: MarkdownLinkLabel;
}

export abstract class LinkBase extends Inline {
    private _destinationSyntax: MarkdownLinkDestination | undefined;
    private _titleSyntax: MarkdownLinkTitle | undefined;
    private _labelSyntax: MarkdownLinkLabel | undefined;
    private _resolvedReference: MarkdownLinkReference | undefined;
    private _documentVersion: number = -1;

    public constructor(parameters?: ILinkBaseParameters) {
        super(parameters);
        this.attachSyntax(this._destinationSyntax = parameters && parameters.destination);
        this.attachSyntax(this._titleSyntax = parameters && parameters.title);
        this.attachSyntax(this._labelSyntax = parameters && parameters.label);
    }

    public get destinationSyntax(): MarkdownLinkDestination | undefined {
        return this._destinationSyntax;
    }

    public get titleSyntax(): MarkdownLinkTitle | undefined {
        return this._titleSyntax;
    }

    public get labelSyntax(): MarkdownLinkLabel | undefined {
        return this._labelSyntax;
    }

    public get href(): string {
        if (this.destinationSyntax) return this.destinationSyntax.href;
        const linkReference: MarkdownLinkReference | undefined = this._resolveLinkReference();
        return linkReference ? linkReference.href : "";
    }

    public set href(value: string) {
        this._applyLinkReference();
        this._ensureDestinationSyntax().href = value;
    }

    public get title(): string | undefined {
        if (this.titleSyntax) return this.titleSyntax.text;
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
    protected getSyntax(): ReadonlyArray<Syntax | undefined> {
        return [
            this.destinationSyntax,
            this.titleSyntax,
            this.labelSyntax
        ];
    }

    private _ensureDestinationSyntax(): MarkdownLinkDestination {
        if (!this._destinationSyntax) {
            this.attachSyntax(this._destinationSyntax = new MarkdownLinkDestination());
        }
        return this._destinationSyntax;
    }

    private _ensureTitleSyntax(): MarkdownLinkTitle {
        if (!this._titleSyntax) {
            this.attachSyntax(this._titleSyntax = new MarkdownLinkTitle());
        }
        return this._titleSyntax;
    }

    private _ensureLabelSyntax(): MarkdownLinkLabel {
        if (!this._labelSyntax) {
            this.attachSyntax(this._labelSyntax = new MarkdownLinkLabel());
        }
        return this._labelSyntax;
    }

    private _maybeInvalidateResolvedReference(): void {
        if (this._resolvedReference && (!this.ownerDocument || !this.labelSyntax || Node.getVersion(this.ownerDocument) !== this._documentVersion)) {
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
            } else {
                const state: IParserState | undefined = this.getParserState();
                refLabel = state && state.refLabel;
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
            this._ensureDestinationSyntax().href = linkReference.href;
            if (linkReference.title !== undefined) {
                this._ensureTitleSyntax().text = linkReference.title;
            }
            this._labelSyntax = undefined;
            this._maybeInvalidateResolvedReference();
        }
    }
}
