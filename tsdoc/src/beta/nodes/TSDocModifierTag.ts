import { SyntaxKind } from "./SyntaxKind";
import { TSDocTagName } from "./TSDocTagName";
import { Block, IBlockParameters } from "./Block";
import { Node } from "./Node";
import { SyntaxElement } from "./SyntaxElement";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { TSDocBlockTagSyntax } from "../syntax/tsdoc/block/TSDocBlockTagSyntax";
import { mixin } from "../mixin";
import { BlockSiblingMixin } from "./mixins/BlockSiblingMixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";

export interface ITSDocModifierTagParameters extends IBlockParameters {
    tagName?: TSDocTagName | string;
}

export class TSDocModifierTag extends mixin(Block, [
    BlockChildMixin,
    BlockSiblingMixin
]) {
    private _tagNameSyntax: TSDocTagName;

    public constructor(parameters: ITSDocModifierTagParameters = {}) {
        super(parameters);
        this.attachSyntax(this._tagNameSyntax =
            parameters.tagName instanceof TSDocTagName ? parameters.tagName :
            new TSDocTagName({ text: parameters.tagName }));
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.TSDocModifierTag {
        return SyntaxKind.TSDocModifierTag;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<TSDocModifierTag> {
        return TSDocBlockTagSyntax;
    }

    /**
     * Gets or sets the TSDoc tag name for this block.
     */
    public get tagName(): string {
        return this._tagNameSyntax.text;
    }

    public set tagName(value: string) {
        this._tagNameSyntax.text = value;
    }

    /**
     * {@inheritdoc Node.canHaveParent()}
     * @override
     */
    public canHaveParent(node: Node): boolean {
        return node.isDocument();
    }

    /**
     * {@inheritdoc Node.getSyntaxElements()}
     * @override
     */
    public getSyntaxElements(): ReadonlyArray<SyntaxElement> {
        return [this._tagNameSyntax];
    }
}
