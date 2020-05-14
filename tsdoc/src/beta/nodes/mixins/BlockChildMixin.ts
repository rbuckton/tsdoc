import { Node, INodeConstructor } from "../Node";
import { Block } from "../Block";

/**
 * Represents a {@link Node} that can be the child of a {@link Block}.
 */
export interface IBlockChild {
    /**
     * Gets the parent node of this node if that parent is a {@link Block}.
     */
    readonly parentBlock: Block | undefined;
}

export function BlockChildMixin<TBase extends INodeConstructor>(baseClass: TBase): TBase & (new (...args: any[]) => IBlockChild);
export function BlockChildMixin<TBase extends new (...args: any[]) => Node>(baseClass: TBase): TBase & (new (...args: any[]) => IBlockChild) {
    abstract class BlockChild extends baseClass {
        get parentBlock(): Block | undefined {
            const parent: Node | undefined = this.parent;
            return parent && parent.isBlock() ? parent : undefined;
        }
        canHaveParent(parent: Node): boolean {
            return parent.isBlock()
                || super.canHaveParent(parent);
        }
    }
    return BlockChild;
}
