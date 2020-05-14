import { Content, IContentConstructor } from "../Content";
import { Block } from "../Block";
import { Node } from "../Node";
import { Inline } from "../Inline";

export interface IBlockContainerParameters {
    content?: string | Inline | Block | ReadonlyArray<string | Inline | Block>;
}

/**
 * Represents a {@link Node} that can contain {@link Block} nodes.
 */
export interface IBlockContainer {
    /**
     * @override
     */
    isBlockContainer(): true;
    /**
     * Gets the first child of this node if that child is a {@link Block}.
     */
    readonly firstChildBlock: Block | undefined;
    /**
     * Gets the last child of this node if that child is a {@link Block}.
     */
    readonly lastChildBlock: Block | undefined;
}

export function BlockContainerMixin<TBase extends IContentConstructor>(baseClass: TBase): TBase & (new (...args: any[]) => IBlockContainer);
export function BlockContainerMixin<TBase extends new (...args: any[]) => Content>(baseClass: TBase): TBase & (new (...args: any[]) => IBlockContainer) {
    abstract class BlockContainer extends baseClass {
        isBlockContainer(): true {
            return true;
        }
        get firstChildBlock(): Block | undefined {
            const firstChild: Node | undefined = this.firstChild;
            return firstChild && firstChild.isBlock() ? firstChild : undefined;
        }
        get lastChildBlock(): Block | undefined {
            const lastChild: Node | undefined = this.lastChild;
            return lastChild && lastChild.isBlock() ? lastChild : undefined;
        }
        canHaveChild(child: Node): boolean {
            return child.isBlock()
                || super.canHaveChild(child);
        }
    }
    return BlockContainer;
}
