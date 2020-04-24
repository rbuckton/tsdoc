import { INodeParameters, Node } from "./Node";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IContentParameters extends INodeParameters {
}

export abstract class Content extends Node {
    // @ts-ignore
    private _contentBrand: never;
    private _previousSibling: Content | undefined;
    private _nextSibling: Content | undefined;
    private _firstChild: Content | undefined;
    private _lastChild: Content | undefined;

    public constructor(parameters?: IContentParameters) {
        super(parameters);
    }

    /**
     * Gets the parent of this node if that parent is a `Content`.
     */
    public get parentContent(): Content | undefined {
        return this.parent && this.parent.isContent() ? this.parent : undefined;
    }

    /**
     * Gets the previous sibling of this node.
     */
    public get previousSibling(): Content | undefined {
        return this._previousSibling;
    }

    /**
     * Gets the next sibling of this node.
     */
    public get nextSibling(): Content | undefined {
        return this._nextSibling;
    }

    /**
     * Gets the first child of this node.
     */
    public get firstChild(): Content | undefined {
        return this._firstChild;
    }

    /**
     * Gets the last child of this node.
     */
    public get lastChild(): Content | undefined {
        return this._lastChild;
    }

    /** @override */
    public isContent(): true {
        return true;
    }

    /**
     * Appends a node as a child of this node.
     * @returns `true` if the child was appended; otherwise, `false`.
     */
    public appendChild(child: Content): boolean {
        if (this.canHaveChild(child) && child.canHaveParent(this) && child.isContent()) {
            child.removeNode();
            child.setParent(this);
            if (this._lastChild) {
                child._previousSibling = this._lastChild;
                this._lastChild = this._lastChild._nextSibling = child;
            } else {
                this._firstChild = this._lastChild = child;
            }
            return true;
        }
        return false;
    }

    /**
     * Removes a child node from this node.
     * @returns `true` if the child was removed; otherwise, `false`.
     */
    public removeChild(child: Content): boolean {
        if (child.parent === this && this.canHaveChild(child) && child.canHaveParent(this) && child.isContent()) {
            child.removeNode();
            return true;
        }
        return false;
    }

    /**
     * Inserts a new sibling node prior to this node.
     * @returns `true` if the sibling was inserted; otherwise, `false`.
     */
    public insertSiblingBefore(newSibling: Content): boolean {
        if (!this.parent ||
            !this.parent.isContent() ||
            !this.parent.canHaveChild(newSibling) ||
            !newSibling.isContent() ||
            !newSibling.canHaveParent(this.parent)) {
            return false;
        }
        newSibling.removeNode();
        newSibling._previousSibling = this._previousSibling;
        if (newSibling._previousSibling) {
            newSibling._previousSibling!._nextSibling = newSibling;
        }
        this._previousSibling = newSibling;
        newSibling._nextSibling = this;
        newSibling.setParent(this.parent);
        if (!newSibling._previousSibling) {
            this.parent._firstChild = newSibling;
        }
        return true;
    }

    /**
     * Inserts a new sibling node following this node.
     * @returns `true` if the sibling was inserted; otherwise, `false`.
     */
    public insertSiblingAfter(newSibling: Content): boolean {
        if (!this.parent ||
            !this.parent.isContent() ||
            !this.parent.canHaveChild(newSibling) ||
            !newSibling.isContent() ||
            !newSibling.canHaveParent(this.parent)) {
            return false;
        }
        newSibling.removeNode();
        newSibling._nextSibling = this._nextSibling;
        if (newSibling._nextSibling) {
            newSibling._nextSibling!._previousSibling = newSibling;
        }
        this._nextSibling = newSibling;
        newSibling._previousSibling = this;
        newSibling.setParent(this.parent);
        if (!newSibling._nextSibling) {
            this.parent._lastChild = newSibling;
        }
        return true;
    }

    /**
     * Replaces this node with the provided node in the document hierarchy.
     */
    public replaceNodeWith(newNode: Content): boolean {
        if (this.insertSiblingAfter(newNode)) {
            this.removeNode();
            return true;
        }
        return false;
    }

    /**
     * Removes this node from the document.
     * @override
     */
    public removeNode(): void {
        if (this.parent && this.parent.isContent()) {
            if (this._previousSibling) {
                this._previousSibling._nextSibling = this._nextSibling;
            } else if (this.parent && this.parent._firstChild === this) {
                this.parent._firstChild = this._nextSibling;
            }
            if (this._nextSibling) {
                this._nextSibling._previousSibling = this._previousSibling;
            } else if (this.parent && this.parent._lastChild === this) {
                this.parent._lastChild = this._previousSibling;
            }
        }
        this._previousSibling = undefined;
        this._nextSibling = undefined;
        this.setParent(undefined);
    }

    /**
     * Iterates through each syntactic and content element of this node.
     * @param cb The callback to execute for each node. If the callback returns a value other than `undefined`, iteration
     * stops and that value is returned.
     *
     * @override
     */
    public forEachNode<A extends any[], T>(cb: (node: Node, ...args: A) => T | undefined, ...args: A): T | undefined {
        return this.forEachSyntax(cb, ...args) || this.forEachChild(cb, ...args);
    }

    /**
     * Iterates through each content child of this node.
     * @param cb The callback to execute for each node. If the callback returns a value other than `undefined`, iteration
     * stops and that value is returned.
     */
    public forEachChild<A extends any[], T>(cb: (node: Content, ...args: A) => T | undefined, ...args: A): T | undefined {
        let child: Content | undefined = this._firstChild;
        while (child) {
            const next: Content | undefined = child._nextSibling;
            const result: T | undefined = cb(child, ...args);
            if (result !== undefined) {
                return result;
            }
            child = next;
        }
        return undefined;
    }

    protected abstract print(printer: TSDocPrinter): void;

    protected printChildren(printer: TSDocPrinter): void {
        this.forEachChild(child => child.print(printer));
    }
}