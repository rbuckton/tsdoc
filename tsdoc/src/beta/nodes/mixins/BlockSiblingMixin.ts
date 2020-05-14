import { Content, IContentConstructor } from "../Content";
import { Block } from "../Block";
import { Node } from "../Node";

export interface IBlockSibling {
    /**
     * Gets the previous sibling of this node if that sibling is a `Block`.
     */
    readonly previousSiblingBlock: Block | undefined;
    /**
     * Gets the next sibling of this node if that sibling is a `Block`.
     */
    readonly nextSiblingBlock: Block | undefined;
}

export function BlockSiblingMixin<TBase extends IContentConstructor>(baseClass: TBase): TBase & (new (...args: any[]) => IBlockSibling);
export function BlockSiblingMixin<TBase extends new (...args: any[]) => Content>(baseClass: TBase): TBase & (new (...args: any[]) => IBlockSibling) {
    abstract class BlockSibling extends baseClass {
        get previousSiblingBlock(): Block | undefined {
            const previousSibling: Node | undefined = this.previousSibling;
            return previousSibling && previousSibling.isBlock() ? previousSibling : undefined;
        }
        get nextSiblingBlock(): Block | undefined {
            const nextSibling: Node | undefined = this.nextSibling;
            return nextSibling && nextSibling.isBlock() ? nextSibling : undefined;
        }
    }
    return BlockSibling;
}
