import { SyntaxKind } from "./SyntaxKind";
import { TSDocTagName } from "./TSDocTagName";
import { Block, IBlockParameters } from "./Block";
import { Node } from "./Node";
import { SyntaxElement } from "./SyntaxElement";
import { ContentUtils } from "../utils/ContentUtils";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { TSDocBlockTagSyntax } from "../syntax/tsdoc/block/TSDocBlockTagSyntax";
import { BlockContainerMixin, IBlockContainerParameters } from "./mixins/BlockContainerMixin";
import { mixin } from "../mixin";
import { BlockSiblingMixin } from "./mixins/BlockSiblingMixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";

export interface ITSDocBlockTagParameters extends IBlockParameters, IBlockContainerParameters {
    tagName?: TSDocTagName | string;
}

export class TSDocBlockTag extends mixin(Block, [
    BlockChildMixin,
    BlockSiblingMixin,
    BlockContainerMixin
]) {
    private _tagNameSyntax: TSDocTagName;

    public constructor(parameters: ITSDocBlockTagParameters = {}) {
        super(parameters);
        this.attachSyntax(this._tagNameSyntax =
            parameters.tagName instanceof TSDocTagName ? parameters.tagName :
            new TSDocTagName({ text: parameters.tagName }));
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.TSDocBlockTag {
        return SyntaxKind.TSDocBlockTag;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<TSDocBlockTag> {
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
