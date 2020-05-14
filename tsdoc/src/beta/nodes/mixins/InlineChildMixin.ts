import { Inline } from "../Inline";
import { Node, INodeConstructor } from "../Node";

/**
 * Represents a {@link Node} that can be the child of an {@link Inline}.
 */
export interface IInlineChild {
    /**
     * Gets the parent of this node, if that parent is an {@link Inline}.
     */
    readonly parentInline: Inline | undefined;
}

export function InlineChildMixin<TBase extends INodeConstructor>(baseClass: TBase): TBase & (new (...args: any[]) => IInlineChild);
export function InlineChildMixin<TBase extends new (...args: any[]) => Node>(baseClass: TBase): TBase & (new (...args: any[]) => IInlineChild) {
    abstract class InlineChild extends baseClass {
        get parentInline(): Inline | undefined {
            const parent: Node | undefined = this.parent;
            return parent && parent.isInline() ? parent : undefined;
        }
        canHaveParent(parent: Node): boolean {
            return parent.isInline()
                || super.canHaveParent(parent);
        }
    }
    return InlineChild;
}
