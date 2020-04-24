import { SyntaxKind } from "./SyntaxKind";
import { Node, DocumentPosition } from "./Node";
import { Block, IBlockParameters } from "./Block";
import { MarkdownLinkReference } from "./MarkdownLinkReference";
import { MarkdownUtils } from "../parser/utils/MarkdownUtils";
import { MarkdownLinkLabel } from "./MarkdownLinkLabel";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IDocumentParameters extends IBlockParameters {
    text?: string;
}

export class Document extends Block {
    private _text: string | undefined;
    private _referenceMap = new Map<string, MarkdownLinkReference>();
    private _allReferences = new Map<string, MarkdownLinkReference[]>();

    public constructor(parameters?: IDocumentParameters) {
        super(parameters);
        this._text = parameters && parameters.text;
    }

    /** @override */
    public get kind(): SyntaxKind.Document {
        return SyntaxKind.Document;
    }

    public get text(): string | undefined {
        return this._text;
    }

    public get referenceMap(): ReadonlyMap<string, MarkdownLinkReference> {
        return this._referenceMap;
    }

    /** @override */
    public isBlockContainer(): true {
        return true;
    }

    /** @override */
    public isDocument(): true {
        return true;
    }

    /** @override */
    public canHaveParent(node: Node): false {
        return false;
    }

    /** @override */
    public canHaveChild(node: Node): boolean {
        return node.isBlock();
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

    /** @override */
    protected onNodeAttached(node: Node): void {
        if (node instanceof MarkdownLinkReference) {
            this._attachLinkReference(node);
        }
    }

    /** @override */
    protected onNodeDetached(node: Node): void {
        if (node instanceof MarkdownLinkReference) {
            this._detachLinkReference(node);
        }
    }

    /** @override */
    protected onNodeChanging(node: Node): void {
        if (node instanceof MarkdownLinkReference) {
            this._detachLinkReference(node);
        } else if (node instanceof MarkdownLinkLabel && node.parent instanceof MarkdownLinkReference) {
            this._detachLinkReference(node.parent);
        }
    }

    /** @override */
    protected onNodeChanged(node: Node): void {
        if (node instanceof MarkdownLinkReference) {
            this._attachLinkReference(node);
        } else if (node instanceof MarkdownLinkLabel && node.parent instanceof MarkdownLinkReference) {
            this._attachLinkReference(node.parent);
        }
    }

    /** @override */
    protected setOwnerDocument(ownerDocument: Document | undefined): void {
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        this.printChildren(printer);
    }
}
