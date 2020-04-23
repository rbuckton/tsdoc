import { SyntaxKind } from "./SyntaxKind";
import { IParserState, ParserBase } from "../parser/ParserBase";

// type-only imports
type Document = import("./Document").Document;
type Syntax = import("./Syntax").Syntax;
type Content = import("./Content").Content;
type Block = import("./Block").Block;
type Inline = import("./Inline").Inline;
type ListBase = import("./ListBase").ListBase;
type ListItemBase = import("./ListItemBase").ListItemBase;
type LinkBase = import("./LinkBase").LinkBase;

declare const assignabilityHack: unique symbol;

export interface INodeParameters {
    pos?: number;
    end?: number;

    // ensures INodeParameters is not treated as an empty object.
    [assignabilityHack]?: never;
}

export const enum DocumentPosition {
    Unrelated,
    Preceding,
    Contains,
    Same,
    ContainedBy,
    Following,
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
    public isBlockContainer(): boolean {
        return false;
    }

    /**
     * Indicates whether this node can contain `ListItemBase` nodes.
     * @virtual
     */
    public isListItemContainer(): boolean {
        return false;
    }

    /**
     * Indicates whether this node can contain `Inline` nodes.
     * @virtual
     */
    public isInlineContainer(): boolean {
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

    /** @virtual */
    public removeNode(): void {
        this.setParent(undefined);
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

    private static _compareDocumentPositions(node1: Node, node2: Node): DocumentPosition {
        if (node1 === node2) return DocumentPosition.Same;
        if (node1.contains(node2)) return DocumentPosition.Contains;
        if (node2.contains(node1)) return DocumentPosition.ContainedBy;

        let context1: Node = node1;
        let context1Parent: Node | undefined = context1.parent;
        while (context1Parent && !context1Parent.contains(node2)) {
            context1 = context1Parent;
            context1Parent = context1.parent;
        }

        if (!context1Parent) return DocumentPosition.Unrelated;

        let context2: Node = node2;
        let context2Parent: Node | undefined = context2.parent;
        while (context2Parent && !context2Parent.contains(node1)) {
            context2 = context2Parent;
            context2Parent = context2.parent;
        }

        if (!context2Parent) return DocumentPosition.Unrelated;

        if (context1Parent !== context2Parent) {
            if (context1Parent.contains(context2Parent)) {
                while (context2Parent && context2Parent !== context1Parent) {
                    context2 = context2Parent;
                    context2Parent = context2.parent;
                }
            }
            else if (context2Parent.contains(context1Parent)) {
                while (context1Parent && context1Parent !== context2Parent) {
                    context1 = context1Parent;
                    context1Parent = context1.parent;
                }
            }
        }

        if (!context1Parent || !context2Parent || context1Parent !== context2Parent) {
            return DocumentPosition.Unrelated;
        }

        return context1Parent.forEachNode(node => {
            if (node === context1) return DocumentPosition.Preceding;
            if (node === context2) return DocumentPosition.Following;
            return undefined;
        }) || DocumentPosition.Unrelated;
    }

    /**
     * Determines the position of `other` relative to this node.
     */
    public compareDocumentPosition(other: Node): DocumentPosition {
        return Node._compareDocumentPositions(other, this);
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
            const result: T | undefined = syntax && cb(syntax, ...args);
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
            node.setParent(this);
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

    /** @virtual */
    protected getSyntax(): ReadonlyArray<Syntax | undefined> {
        return [];
    }

    protected static getVersion(node: Node): number {
        return node._version;
    }

    /** @virtual */
    protected onInvalidated(): void {}

    protected invalidate(): void {
        this._version++;
        this.onInvalidated();
        if (this.parent) {
            this.parent.invalidate();
        }
    }

    /** @virtual */
    protected onParentChanging(): void {}
    /** @virtual */
    protected onParentChanged(): void {}
    /** @virtual */
    protected onChildAttached(node: Node) {}
    /** @virtual */
    protected onChildDetached(node: Node) {}

    /**
     * This method supports the tsdoc infrastructure and is not intended to be used in user code.
     */
    protected setParent(newParent: Node | undefined): void {
        if (this._parent !== newParent) {
            this.onParentChanging();
            if (this._parent) this._parent.onChildDetached(this);
            this._parent = newParent;
            if (this._parent) this._parent.onChildAttached(this);
            this.invalidate();
            this.onParentChanged();
            this.setOwnerDocument(newParent && (newParent.isDocument() ? newParent : newParent._ownerDocument));
        }
    }

    /** @virtual */
    protected onOwnerDocumentChanging(): void {}
    /** @virtual */
    protected onOwnerDocumentChanged(): void {}
    /** @virtual */
    protected onNodeAttached(this: Document, node: Node) {}
    /** @virtual */
    protected onNodeDetached(this: Document, node: Node) {}

    private _raiseOnNodeAttached(this: Document, node: Node) {
        this.onNodeAttached(node);
    }

    private _raiseOnNodeDetached(this: Document, node: Node) {
        this.onNodeDetached(node);
    }

    /**
     * This method supports the tsdoc infrastructure and is not intended to be used in user code.
     */
    protected setOwnerDocument(ownerDocument: Document | undefined): void {
        if (this.ownerDocument !== ownerDocument) {
            this.onOwnerDocumentChanging();
            if (this._ownerDocument) this._ownerDocument._raiseOnNodeDetached(this);
            this._ownerDocument = ownerDocument;
            if (this._ownerDocument) this._ownerDocument._raiseOnNodeAttached(this);
            this.onOwnerDocumentChanged();
            this.forEachNode(node => node.setOwnerDocument(ownerDocument));
        }
    }

    /** @virtual */
    protected onNodeChanging(this: Document, node: Node) {}
    /** @virtual */
    protected onNodeChanged(this: Document, node: Node) {}

    private _raiseOnNodeChanging(this: Document, node: Node) {
        this.onNodeChanging(node);
    }

    private _raiseOnNodeChanged(this: Document, node: Node) {
        this.onNodeChanged(node);
    }

    protected beforeChange(): void {
        if (this._ownerDocument) {
            this._ownerDocument._raiseOnNodeChanging(this);
        }
        const state: IParserState | undefined = this[ParserBase.parserState];
        if (state) {
            this.applyParserState(state);
            this[ParserBase.parserState] = undefined;
        }
    }

    protected afterChange(): void {
        if (this._ownerDocument) {
            this._ownerDocument._raiseOnNodeChanged(this);
        }
    }

    /** @ignore */
    public [ParserBase.parserState]?: IParserState;

    /**
     * This method supports the tsdoc infrastructure and is not intended to be used in user code.
     */
    protected getParserState(): IParserState | undefined {
        return this[ParserBase.parserState];
    }

    /**
     * This method supports the tsdoc infrastructure and is not intended to be used in user code.
     * @virtual
     */
    protected applyParserState(state: IParserState): void {}
}