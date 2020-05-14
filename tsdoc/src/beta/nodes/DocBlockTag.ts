import { SyntaxKind } from "./SyntaxKind";
import { DocTagName } from "./DocTagName";
import { Block, IBlockParameters } from "./Block";
import { Node } from "./Node";
import { SyntaxElement } from "./SyntaxElement";
import { ContentUtils } from "../utils/ContentUtils";
import { IBlockSyntax } from "../syntax/IBlockSyntax";
import { DocBlockTagSyntax } from "../syntax/tsdoc/block/DocBlockTagSyntax";
import { BlockContainerMixin, IBlockContainerParameters } from "./mixins/BlockContainerMixin";
import { mixin } from "../mixin";
import { BlockSiblingMixin } from "./mixins/BlockSiblingMixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";

export interface IDocBlockTagParameters extends IBlockParameters, IBlockContainerParameters {
    tagName?: DocTagName | string;
}

export class DocBlockTag extends mixin(Block, [
    BlockChildMixin,
    BlockSiblingMixin,
    BlockContainerMixin
]) {
    private _tagNameSyntax: DocTagName;

    public constructor(parameters: IDocBlockTagParameters = {}) {
        super(parameters);
        this.attachSyntax(this._tagNameSyntax =
            parameters.tagName instanceof DocTagName ? parameters.tagName :
            new DocTagName({ text: parameters.tagName }));
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.DocBlockTag {
        return SyntaxKind.DocBlockTag;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<DocBlockTag> {
        return DocBlockTagSyntax;
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
