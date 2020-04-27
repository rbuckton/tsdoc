import { SyntaxKind } from "./SyntaxKind";
import { TSDocPrinter } from "../parser/TSDocPrinter";

// TODO: These should be type-only imports, but that requires TS 3.8
type Document = import("./Document").Document;
type Syntax = import("./Syntax").Syntax;
type Content = import("./Content").Content;
type Block = import("./Block").Block;
type IBlockContainer = import("./Block").IBlockParameters;
type Inline = import("./Inline").Inline;
type IInlineContainer = import("./Inline").IInlineContainer;
type ListBase = import("./ListBase").ListBase;
type ListItemBase = import("./ListItemBase").ListItemBase;
type IListItemContainer = import("./ListItemBase").IListItemContainer;
type LinkBase = import("./LinkBase").LinkBase;

declare const assignabilityHack: unique symbol;

export interface INodeParameters {
    pos?: number;
    end?: number;

    // ensures INodeParameters is not treated as an empty object.
    [assignabilityHack]?: never;
}

export const enum DocumentPosition {
    /**
     * Indicates the provided node is the same as this node.
     */
    Same,
    /**
     * Indicates the nodes do not belong to the same document hierarchy.
     */
    Unrelated,
    /**
     * Indicates the provided node precedes (and does not contain) this node in the document hierarchy.
     */
    Preceding,
    /**
     * Indicates the provided node follows (and is not contained by) this node in the document hierarchy.
     */
    Following,
    /**
     * Indicates the provided node contains (and therefore also precedes) this node in the document hierarchy.
     */
    Contains,
    /**
     * Indicates the provided node is contained by (and therefore also follows) this node in the document hierarchy.
     */
    ContainedBy,
}

export abstract class Node {
    public abstract readonly kind: SyntaxKind;

    private _version: number = 0;
    private _pos: number;
    private _end: number;
    private _parent: Node | undefined;
    private _ownerDocument: Document | undefined;

    public constructor(parameters?: INodeParameters) {
        this._pos = parameters && parameters.pos !== undefined ? parameters.pos : -1;
        this._end = parameters && parameters.end !== undefined ? parameters.end : -1;
    }

    /**
     * Gets or sets the offset into the original source text at which this node starts.
     */
    public get pos(): number {
        return this._pos;
    }

    public set pos(value: number) {
        this._pos = value;
    }

    /**
     * Gets or sets the offset into the original source text at which this node ends.
     */
    public get end(): number {
        return this._end;
    }

    public set end(value: number) {
        this._end = value;
    }

    /**
     * Gets the parent node for this node.
     */
    public get parent(): Node | undefined {
        return this._parent;
    }

    /**
     * Gets the document that contains this node.
     */
    public get ownerDocument(): Document | undefined {
        return this.isDocument() ? undefined : this._ownerDocument;
    }

    /**
     * Indicates whether this node can contain `Block` nodes.
     * @virtual
     */
    public isBlockContainer(): this is IBlockContainer {
        return false;
    }

    /**
     * Indicates whether this node can contain `ListItemBase` nodes.
     * @virtual
     */
    public isListItemContainer(): this is IListItemContainer {
        return false;
    }

    /**
     * Indicates whether this node can contain `Inline` nodes.
     * @virtual
     */
    public isInlineContainer(): this is IInlineContainer {
        return false;
    }

    /**
     * Indicates whether this node is a syntactic element.
     * @virtual
     */
    public isSyntax(): this is Syntax {
        return false;
    }

    /**
     * Indicates whether this node is content.
     * @virtual
     */
    public isContent(): this is Content {
        return false;
    }

    /**
     * Indicates whether this node is block content.
     * @virtual
     */
    public isBlock(): this is Block {
        return false;
    }

    /**
     * Indicates whether this node is inline content.
     * @virtual
     */
    public isInline(): this is Inline {
        return false;
    }

    /**
     * Indicates whether this node is document content.
     * @virtual
     */
    public isDocument(): this is Document {
        return false;
    }

    /**
     * Indicates whether this node is a list.
     * @virtual
     */
    public isList(): this is ListBase {
        return false;
    }

    /**
     * Indicates whether this node is a list item.
     * @virtual
     */
    public isListItem(): this is ListItemBase {
        return false;
    }

    /**
     * Indicates whether this node is a link item.
     * @virtual
     */
    public isLink(): this is LinkBase {
        return false;
    }

    /**
     * Indicates whether this node is permitted to have the provided node as its parent.
     * @virtual
     */
    public canHaveParent(parent: Node): boolean {
        if (this.isBlock() && parent.isBlockContainer()) return true;
        if (this.isListItem() && parent.isListItemContainer()) return true;
        if (this.isInline() && parent.isInlineContainer()) return true;
        return false;
    }

    /**
     * Indicates whether this node is permitted to have the provided node as its child.
     * @virtual
     */
    public canHaveChild(child: Node): boolean {
        if (child.isDocument()) return false;
        if (this.isBlockContainer() && child.isBlock()) return true;
        if (this.isListItemContainer() && child.isListItem()) return true;
        if (this.isInlineContainer() && child.isInline()) return true;
        return false;
    }

    /**
     * Remove this node from its parent.
     * @virtual
     */
    public removeNode(): void {
        this._setParent(undefined);
    }

    /**
     * Determines wither this node contains the provided node.
     */
    public contains(other: Node): boolean {
        if (other === this) return true;
        while (other.parent) {
            if (other.parent === this) return true;
            other = other.parent;
        }
        return false;
    }

    /**
     * Determines the position of `other` relative to this node.
     */
    public compareDocumentPosition(other: Node): DocumentPosition {
        if (other === this) return DocumentPosition.Same;
        if (other.contains(this)) return DocumentPosition.Contains;
        if (this.contains(other)) return DocumentPosition.ContainedBy;

        // Find the nearest ancestor to `other` that contains `this`.
        let otherContext: Node = other;
        let otherAncestor: Node | undefined = otherContext.parent;
        while (otherAncestor && !otherAncestor.contains(this)) {
            otherContext = otherAncestor;
            otherAncestor = otherContext.parent;
        }

        // If no ancestor of `other` contained `this` then `other` and `this` aren't
        // part of the same tree.
        if (!otherAncestor) return DocumentPosition.Unrelated;

        // Find the nearest ancestor to `this` that contains `other`.
        let thisContext: Node = this;
        let thisAncestor: Node | undefined = thisContext.parent;
        while (thisAncestor && !thisAncestor.contains(other)) {
            thisContext = thisAncestor;
            thisAncestor = thisContext.parent;
        }

        // If no ancestor of `this` contained `other` then `other` and `this` aren't
        // part of the same tree.
        if (!thisAncestor) return DocumentPosition.Unrelated;

        // If the containing ancestors on each side aren't the same
        // we need to ascend the ancestors of the side that is deeper
        // in the tre until we find a context node that is a sibling of the
        // context node of the ancestor that is higher in the tree.
        if (otherAncestor !== thisAncestor) {
            if (otherAncestor.contains(thisAncestor)) {
                // The ancestor of `other` constains the ancestor of `this`
                // so we walk up the tree on `this`'s side until they meet.
                while (thisAncestor && thisAncestor !== otherAncestor) {
                    thisContext = thisAncestor;
                    thisAncestor = thisContext.parent;
                }
            } else if (thisAncestor.contains(otherAncestor)) {
                // The ancestor of `this` constains the ancestor of `other`
                // so we walk up the tree on `other`'s side until they meet.
                while (otherAncestor && otherAncestor !== thisAncestor) {
                    otherContext = otherAncestor;
                    otherAncestor = otherContext.parent;
                }
            }
        }

        // If we still haven't found a common ancestor then `other` and `this`
        // aren't part of the same tree.
        if (!otherAncestor || !thisAncestor || otherAncestor !== thisAncestor) {
            return DocumentPosition.Unrelated;
        }

        // Iterate each node of the common ancestor in document order to determine
        // which context node comes first.
        return otherAncestor.forEachNode(node => {
            if (node === otherContext) return DocumentPosition.Preceding;
            if (node === thisContext) return DocumentPosition.Following;
            return undefined;
        }) || DocumentPosition.Unrelated;
    }

    /**
     * Iterates through each syntactic and content element of this node.
     * @param cb The callback to execute for each node. If the callback returns a value other than `undefined`, iteration
     * stops and that value is returned.
     * @virtual
     */
    public forEachNode<A extends any[], T>(cb: (node: Node, ...args: A) => T | undefined, ...args: A): T | undefined {
        return this.forEachSyntax(cb, ...args);
    }

    /**
     * Iterates through each syntactic element of this node.
     * @param cb The callback to execute for each node. If the callback returns a value other than `undefined`, iteration
     * stops and that value is returned.
     */
    public forEachSyntax<A extends any[], T>(cb: (node: Syntax, ...args: A) => T | undefined, ...args: A): T | undefined {
        for (const syntax of this.getSyntax()) {
            const result: T | undefined = cb(syntax, ...args);
            if (result !== undefined) {
                return result;
            }
        }
        return undefined;
    }

    /**
     * Attaches a `Syntax` node (or an array of `Syntax` nodes) to this element.
     */
    protected attachSyntax(node: Syntax | ReadonlyArray<Syntax> | undefined): void {
        if ((Array.isArray as (value: unknown) => value is ReadonlyArray<unknown>)(node)) {
            for (const element of node) {
                this.attachSyntax(element);
            }
            return;
        }
        if (node) {
            if (!node.isSyntax()) {
                throw new TypeError("Node was not a syntax element.");
            }
            node.removeNode();
            node._setParent(this);
        }
    }

    /**
     * Detaches a `Syntax` node (or an array of `Syntax` nodes) from this element.
     */
    protected detachSyntax(node: Syntax | ReadonlyArray<Syntax> | undefined): void {
        if ((Array.isArray as (value: unknown) => value is ReadonlyArray<unknown>)(node)) {
            for (const element of node) {
                this.detachSyntax(element);
            }
            return;
        }
        if (node) {
            if (!node.isSyntax()) {
                throw new TypeError("Node was not a syntax element.");
            }
            if (node.parent === this) {
                node.removeNode();
            }
        }
    }

    /**
     * Gets the {@link Syntax} nodes for this node.
     * @virtual
     */
    public getSyntax(): ReadonlyArray<Syntax> {
        return [];
    }

    /**
     * This method supports the tsdoc infrastructure and is not intended to be used in user code.
     * @internal
     */
    protected static _getVersion(node: Node): number {
        return node._version;
    }

    /**
     * When overridden in a derived class, handles operations that should trigger when this node's
     * position has changed within the document hierarchy.
     * @virtual
     */
    protected onInvalidated(): void {}

    private _invalidate(): void {
        this._version++;
        this.onInvalidated();
        if (this._parent) {
            this._parent._invalidate();
        }
    }

    /**
     * When overridden in a derived class, handles operations that should trigger when this node's
     * parent is about to change.
     * @virtual
     */
    protected onParentChanging(): void {}

    /**
     * When overridden in a derived class, handles operations that should trigger when this node's
     * parent has changed.
     * @virtual
     */
    protected onParentChanged(): void {}

    /**
     * When overridden in a derived class, handles operations that should trigger when a child node
     * (either {@link Syntax} or {@link Content} has been attached to this node.
     * @virtual
     */
    protected onChildAttached(node: Node) {}

    /**
     * When overridden in a derived class, handles operations that should trigger when a child node
     * (either {@link Syntax} or {@link Content} has been detached to this node.
     * @virtual
     */
    protected onChildDetached(node: Node) {}

    /**
     * This method supports the tsdoc infrastructure and is not intended to be used in user code.
     * @internal
     */
    protected _setParent(newParent: Node | undefined): void {
        if (this._parent !== newParent) {
            this.onParentChanging();
            if (this._parent) this._parent.onChildDetached(this);
            this._parent = newParent;
            if (this._parent) this._parent.onChildAttached(this);
            this._invalidate();
            this.onParentChanged();
            this._setOwnerDocument(newParent && (newParent.isDocument() ? newParent : newParent._ownerDocument));
        }
    }

    /**
     * When overridden in a derived class, handles operations that should trigger when
     * this node is about to be attached or detached from a {@link Document}.
     * @virtual
     */
    protected onOwnerDocumentChanging(): void {}

    /**
     * When overridden in a derived class, handles operations that should trigger when
     * this node has been attached or detached from a {@link Document}.
     * @virtual
     */
    protected onOwnerDocumentChanged(): void {}

    /**
     * This method supports the tsdoc infrastructure and is not intended to be used in user code.
     * @internal
     * @virtual
     */
    protected onNodeAttached(this: Document, node: Node) {}

    /**
     * This method supports the tsdoc infrastructure and is not intended to be used in user code.
     * @internal
     * @virtual
     */
    protected onNodeDetached(this: Document, node: Node) {}

    private _raiseOnNodeAttached(this: Document, node: Node) {
        this.onNodeAttached(node);
    }

    private _raiseOnNodeDetached(this: Document, node: Node) {
        this.onNodeDetached(node);
    }

    /**
     * This method supports the tsdoc infrastructure and is not intended to be used in user code.
     * @internal
     */
    protected _setOwnerDocument(ownerDocument: Document | undefined): void {
        if (this.ownerDocument !== ownerDocument) {
            this.onOwnerDocumentChanging();
            if (this._ownerDocument) this._ownerDocument._raiseOnNodeDetached(this);
            this._ownerDocument = ownerDocument;
            if (this._ownerDocument) this._ownerDocument._raiseOnNodeAttached(this);
            this.onOwnerDocumentChanged();
            this.forEachNode(node => node._setOwnerDocument(ownerDocument));
        }
    }

    /**
     * This method supports the tsdoc infrastructure and is not intended to be used in user code.
     * @internal
     * @virtual
     */
    protected onNodeChanging(this: Document, node: Node) {}

    /**
     * This method supports the tsdoc infrastructure and is not intended to be used in user code.
     * @internal
     * @virtual
     */
    protected onNodeChanged(this: Document, node: Node) {}

    private _raiseOnNodeChanging(this: Document, node: Node) {
        this.onNodeChanging(node);
    }

    private _raiseOnNodeChanged(this: Document, node: Node) {
        this.onNodeChanged(node);
    }

    /**
     * Notifies the owner {@link Document} of the this node that a property of this node is about to change.
     */
    protected beforeChange(): void {
        if (this._ownerDocument) {
            this._ownerDocument._raiseOnNodeChanging(this);
        }
    }

    /**
     * Notifies the owner {@link Document} of the this node that a property of this node has changed.
     */
    protected afterChange(): void {
        if (this._ownerDocument) {
            this._ownerDocument._raiseOnNodeChanged(this);
        }
    }

    /**
     * This method supports the tsdoc infrastructure and is not intended to be used in user code.
     * @internal
     */
    protected static _printNode(printer: TSDocPrinter, node: Node): void {
        if (node.print) {
            node.print(printer);
        }
    }

    protected print?(printer: TSDocPrinter): void;
}