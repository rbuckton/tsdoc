import { INodeParameters } from "./Node";
import { Block } from "./Block";
import { Content, IContentParameters } from "./Content";

export interface IInlineParameters extends IContentParameters {
}

export abstract class Inline extends Content {
    // @ts-ignore
    private _inlineBrand: never;

    constructor(parameters?: INodeParameters) {
        super(parameters);
    }

    /**
     * Gets the parent of this node, if that parent is a `Block`.
     */
    public get parentBlock(): Block | undefined {
        return this.parent && this.parent.isBlock() ? this.parent : undefined;
    }

    /**
     * Gets the parent of this node, if that parent is an `Inline`.
     */
    public get parentInline(): Inline | undefined {
        return this.parent && this.parent.isInline() ? this.parent : undefined;
    }

    /**
     * Gets the previous sibling of this node, if that sibling is an `Inline`.
     */
    public get previousSiblingInline(): Inline | undefined {
        return this.previousSibling && this.previousSibling.isInline() ? this.previousSibling : undefined;
    }

    /**
     * Gets the next sibling of this node, if that sibling is an `Inline`.
     */
    public get nextSiblingInline(): Inline | undefined {
        return this.nextSibling && this.nextSibling.isInline() ? this.nextSibling : undefined;
    }

    /**
     * Gets the first child of this node, if that child is an `Inline`.
     */
    public get firstChildInline(): Inline | undefined {
        return this.firstChild && this.firstChild.isInline() ? this.firstChild : undefined;
    }

    /**
     * Gets the last child of this node, if that child is an `Inline`.
     */
    public get lastChildInline(): Inline | undefined {
        return this.lastChild && this.lastChild.isInline() ? this.lastChild : undefined;
    }

    /**
     * @override
     */
    public isInline(): true {
        return true;
    }
}