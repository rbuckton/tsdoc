import { Content, IContentConstructor } from "../Content";
import { Inline } from "../Inline";
import { Node } from "../Node";

export interface IInlineSibling {
    /**
     * Gets the previous sibling of this node if that sibling is a `Inline`.
     */
    readonly previousSiblingInline: Inline | undefined;
    /**
     * Gets the next sibling of this node if that sibling is a `Inline`.
     */
    readonly nextSiblingInline: Inline | undefined;
}

export function InlineSiblingMixin<TBase extends IContentConstructor>(baseClass: TBase): TBase & (new (...args: any[]) => IInlineSibling);
export function InlineSiblingMixin<TBase extends new (...args: any[]) => Content>(baseClass: TBase): TBase & (new (...args: any[]) => IInlineSibling) {
    abstract class InlineSibling extends baseClass {
        get previousSiblingInline(): Inline | undefined {
            const previousSibling: Node | undefined = this.previousSibling;
            return previousSibling && previousSibling.isInline() ? previousSibling : undefined;
        }
        get nextSiblingInline(): Inline | undefined {
            const nextSibling: Node | undefined = this.nextSibling;
            return nextSibling && nextSibling.isInline() ? nextSibling : undefined;
        }
    }
    return InlineSibling;
}
