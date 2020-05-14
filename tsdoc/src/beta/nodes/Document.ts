import { SyntaxKind } from "./SyntaxKind";
import { Node } from "./Node";
import { Block, IBlockParameters } from "./Block";
import { MarkdownLinkReference } from "./MarkdownLinkReference";
import { MarkdownUtils } from "../utils/MarkdownUtils";
import { MarkdownLinkLabel } from "./MarkdownLinkLabel";
import { ContentUtils } from "../utils/ContentUtils";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { DocumentSyntax } from "../syntax/tsdoc/block/DocumentSyntax";
import { DocumentPosition } from "./DocumentPosition";
import { IBlockContainerParameters, BlockContainerMixin } from "./mixins/BlockContainerMixin";
import { mixin } from "../mixin";

export interface IDocumentParameters extends IBlockParameters, IBlockContainerParameters {
    text?: string;
}

export class Document extends mixin(Block, [
    BlockContainerMixin,
]) {
    private _text: string | undefined;
    private _referenceMap = new Map<string, MarkdownLinkReference>();
    private _allReferences = new Map<string, MarkdownLinkReference[]>();

    public constructor(parameters?: IDocumentParameters) {
        super(parameters);
        this._text = parameters && parameters.text;
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.Document {
        return SyntaxKind.Document;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<Document> {
        return DocumentSyntax;
    }

    /**
     * Gets the source text of the document.
     */
    public get text(): string | undefined {
        return this._text;
    }

    /**
     * Gets the map of labels to {@link MarkdownLinkReference} nodes in this document.
     */
    public get referenceMap(): ReadonlyMap<string, MarkdownLinkReference> {
        return this._referenceMap;
    }

    /**
     * {@inheritDoc Node.isDocument()}
     * @override
     */
    public isDocument(): true {
        return true;
    }

    /**
     * {@inheritdoc Node.canHaveParent()}
     * @override
     */
    public canHaveParent(node: Node): false {
        return false;
    }

    private static _compareReferences(x: MarkdownLinkReference, y: MarkdownLinkReference): number {
        switch (y.compareDocumentPosition(x)) {
            case DocumentPosition.Preceding: return -1;
            case DocumentPosition.Same: return 0;
            case DocumentPosition.Following: return 1;
            default: throw new Error("Illegal state.");
        }
    }

    private _attachLinkReference(node: MarkdownLinkReference): void {
        const refLabel: string = MarkdownUtils.normalizeLinkReference(node.label);
        if (!refLabel) return;

        let allReferences: MarkdownLinkReference[] | undefined = this._allReferences.get(refLabel);
        if (!allReferences) {
            allReferences = [];
            this._allReferences.set(refLabel, allReferences);
        }

        allReferences.push(node);
        allReferences.sort(Document._compareReferences);
        this._referenceMap.set(refLabel, allReferences[0]);
    }

    private _detachLinkReference(node: MarkdownLinkReference): void {
        const refLabel: string = MarkdownUtils.normalizeLinkReference(node.label);
        if (!refLabel) return;

        const allReferences: MarkdownLinkReference[] | undefined = this._allReferences.get(refLabel);
        if (!allReferences) return;

        const index: number = allReferences.indexOf(node);
        if (index < 0) return;

        allReferences.splice(index, 1);
        if (allReferences.length === 0) {
            this._referenceMap.delete(refLabel);
            this._allReferences.delete(refLabel);
        } else {
            allReferences.sort(Document._compareReferences);
            this._referenceMap.set(refLabel, allReferences[0]);
        }
    }

    /**
     * {@inheritdoc Node._onNodeAttached()}
     * @internal
     * @override
     */
    protected _onNodeAttached(node: Node): void {
        if (node instanceof MarkdownLinkReference) {
            this._attachLinkReference(node);
        }
    }

    /**
     * {@inheritdoc Node._onNodeDetached()}
     * @internal
     * @override
     */
    protected _onNodeDetached(node: Node): void {
        if (node instanceof MarkdownLinkReference) {
            this._detachLinkReference(node);
        }
    }

    /**
     * {@inheritdoc Node.onNodeChanging()}
     * @override
     */
    protected onNodeChanging(node: Node): void {
        if (node instanceof MarkdownLinkReference) {
            this._detachLinkReference(node);
        } else if (node instanceof MarkdownLinkLabel && node.parent instanceof MarkdownLinkReference) {
            this._detachLinkReference(node.parent);
        }
    }

    /**
     * {@inheritdoc Node.onNodeChanged()}
     * @override
     */
    protected onNodeChanged(node: Node): void {
        if (node instanceof MarkdownLinkReference) {
            this._attachLinkReference(node);
        } else if (node instanceof MarkdownLinkLabel && node.parent instanceof MarkdownLinkReference) {
            this._attachLinkReference(node.parent);
        }
    }

    /**
     * {@inheritdoc Node._setOwnerDocument()}
     * @internal
     * @override
     */
    protected _setOwnerDocument(ownerDocument: Document | undefined): void {
    }
}
