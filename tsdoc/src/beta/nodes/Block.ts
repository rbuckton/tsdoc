import { Content, IContentParameters } from "./Content";
import { Inline } from "./Inline";

export interface IBlockParameters extends IContentParameters {
}

export abstract class Block extends Content {
    // @ts-ignore
    private _blockBrand: never;

    public constructor(parameters?: IBlockParameters) {
        super(parameters);
    }

    /**
     * Gets the parent node of this node if that parent is a `Block`.
     */
    public get parentBlock(): Block | undefined {
        return this.parent && this.parent.isBlock() ? this.parent : undefined;
    }

    /**
     * Gets the previous sibling of this node if that sibling is a `Block`.
     */
    public get previousSiblingBlock(): Block | undefined {
        return this.previousSibling && this.previousSibling.isBlock() ? this.previousSibling : undefined;
    }

    /**
     * Gets the next sibling of this node if that sibling is a `Block`.
     */
    public get nextSiblingBlock(): Block | undefined {
        return this.nextSibling && this.nextSibling.isBlock() ? this.nextSibling : undefined;
    }

    /**
     * Gets the first of this node if that child is a `Block`.
     */
    public get firstChildBlock(): Block | undefined {
        return this.firstChild && this.firstChild.isBlock() ? this.firstChild : undefined;
    }

    /**
     * Gets the first of this node if that child is an `Inline`.
     */
    public get firstChildInline(): Inline | undefined {
        return this.firstChild && this.firstChild.isInline() ? this.firstChild : undefined;
    }

    /**
     * Gets the last of this node if that child is a `Block`.
     */
    public get lastChildBlock(): Block | undefined {
        return this.lastChild && this.lastChild.isBlock() ? this.lastChild : undefined;
    }

    /**
     * Gets the last of this node if that child is an `Inline`.
     */
    public get lastInlineChild(): Inline | undefined {
        return this.lastChild && this.lastChild.isInline() ? this.lastChild : undefined;
    }

    /**
     * @override
     */
    public isBlock(): true {
        return true;
    }
}
