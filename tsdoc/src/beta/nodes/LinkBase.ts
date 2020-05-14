import { Inline, IInlineParameters } from "./Inline";
import { MarkdownLinkDestination } from "./MarkdownLinkDestination";
import { MarkdownLinkTitle } from "./MarkdownLinkTitle";
import { MarkdownLinkLabel } from "./MarkdownLinkLabel";
import { SyntaxElement } from "./SyntaxElement";
import { Node } from "./Node";
import { MarkdownUtils } from "../utils/MarkdownUtils";
import { MarkdownLinkReference } from "./MarkdownLinkReference";
import { ContentUtils } from "../utils/ContentUtils";
import { InlineContainerMixin } from "./mixins/InlineContainerMixin";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { InlineChildMixin } from "./mixins/InlineChildMixin";
import { InlineSiblingMixin } from "./mixins/InlineSiblingMixin";

export interface ILinkBaseParameters extends IInlineParameters {
    content?: Inline | ReadonlyArray<Inline> | string;
    destination?: MarkdownLinkDestination | string;
    title?: MarkdownLinkTitle | string;
    label?: MarkdownLinkLabel | string;
}

export abstract class LinkBase extends mixin(Inline, [
    BlockChildMixin,
    InlineChildMixin,
    InlineSiblingMixin,
    InlineContainerMixin,
]) {
    private _destinationSyntax: MarkdownLinkDestination | undefined;
    private _titleSyntax: MarkdownLinkTitle | undefined;
    private _labelSyntax: MarkdownLinkLabel | undefined;
    private _resolvedReference: MarkdownLinkReference | undefined;
    private _documentVersion: number = -1;

    public constructor(parameters: ILinkBaseParameters = {}) {
        super(parameters);
        this.attachSyntax(this._destinationSyntax =
            parameters.destination instanceof MarkdownLinkDestination ? parameters.destination :
            parameters.destination !== undefined ? new MarkdownLinkDestination({ text: parameters.destination }) :
            undefined);
        this.attachSyntax(this._titleSyntax =
            parameters.title instanceof MarkdownLinkTitle ? parameters.title :
            parameters.title !== undefined ? new MarkdownLinkTitle({ text: parameters.title }) :
            undefined);
        this.attachSyntax(this._labelSyntax =
            parameters.label instanceof MarkdownLinkLabel ? parameters.label :
            parameters.label !== undefined ? new MarkdownLinkLabel({ text: parameters.label }) :
            undefined);
        ContentUtils.appendContent(this, parameters.content);
    }

    /**
     * Gets or sets the destination for the link.
     */
    public get destination(): string {
        if (this._destinationSyntax) return this._destinationSyntax.text;
        const linkReference: MarkdownLinkReference | undefined = this._resolveLinkReference();
        return linkReference ? linkReference.destination : "";
    }

    public set destination(value: string) {
        this._applyLinkReference();
        this._ensureDestinationSyntax().text = value;
    }

    /**
     * Gets or sets the title for the link.
     */
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

    /**
     * Gets or sets the reference lable for the link.
     */
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

    /**
     * {@inheritDoc Node.isLink()}
     * @override
     */
    public isLink(): true {
        return true;
    }

    /**
     * {@inheritDoc Node.forEachNode()}
     * @override
     */
    public forEachNode<A extends any[], T>(cb: (node: Node, ...args: A) => T | undefined, ...args: A): T | undefined {
        // inline content comes before other syntax
        return this.forEachChild(cb, ...args)
            || this.forEachSyntaxElement(cb, ...args);
    }

    /**
     * {@inheritDoc Node.getSyntaxElements()}
     * @override
     */
    public getSyntaxElements(): ReadonlyArray<SyntaxElement> {
        const syntax: SyntaxElement[] = [];
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
        if (this._resolvedReference && (!this.ownerDocument || !this._labelSyntax || Node._getVersion(this.ownerDocument) !== this._documentVersion)) {
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
                    this._documentVersion = Node._getVersion(this.ownerDocument);
                }
            }
        }
        return this._resolvedReference;
    }

    private _applyLinkReference(): void {
        const linkReference: MarkdownLinkReference | undefined = this._resolveLinkReference();
        if (linkReference) {
            this._ensureDestinationSyntax().text = linkReference.destination;
            if (linkReference.title !== undefined) {
                this._ensureTitleSyntax().text = linkReference.title;
            }
            this._labelSyntax = undefined;
            this._maybeInvalidateResolvedReference();
        }
    }
}
