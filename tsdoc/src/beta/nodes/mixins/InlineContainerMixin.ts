import { Content, IContentConstructor } from "../Content";
import { Node } from "../Node";
import { Inline } from "../Inline";

export interface IInlineContainerParameters {
    content?: Inline | ReadonlyArray<Inline> | string;
}

/**
 * Represents a {@link Node} that can contain {@link Inline} nodes.
 */
export interface IInlineContainer {
    /**
     * @override
     */
    isInlineContainer(): true;
    /**
     * Gets the first child of this node if that child is an {@link Inline}.
     */
    readonly firstChildInline: Inline | undefined;
    /**
     * Gets the last child of this node if that child is an {@link Inline}.
     */
    readonly lastChildInline: Inline | undefined;
}

export function InlineContainerMixin<TBase extends IContentConstructor>(baseClass: TBase): TBase & (new (...args: any[]) => IInlineContainer);
export function InlineContainerMixin<TBase extends new (...args: any[]) => Content>(baseClass: TBase): TBase & (new (...args: any[]) => IInlineContainer) {
    abstract class InlineContainer extends baseClass {
        isInlineContainer(): true {
            return true;
        }
        get firstChildInline(): Inline | undefined {
            const firstChild: Node | undefined = this.firstChild;
            return firstChild && firstChild.isInline() ? firstChild : undefined;
        }
        get lastChildInline(): Inline | undefined {
            const lastChild: Node | undefined = this.lastChild;
            return lastChild && lastChild.isInline() ? lastChild : undefined;
        }
        canHaveChild(child: Node): boolean {
            return child.isInline()
                && super.canHaveChild(child);
        }
    }
    return InlineContainer;
}
