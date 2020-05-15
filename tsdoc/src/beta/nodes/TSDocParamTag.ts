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

export interface ITSDocParamTagParameters extends IBlockParameters, IBlockContainerParameters {
    tagName?: TSDocTagName | string;
    parameterName?: string;
}

export class TSDocParamTag extends mixin(Block, [
    BlockChildMixin,
    BlockSiblingMixin,
    BlockContainerMixin
]) {
    private _tagNameSyntax: TSDocTagName;
    private _parameterName: string | undefined;

    public constructor(parameters: ITSDocParamTagParameters = {}) {
        super(parameters);
        this.attachSyntax(this._tagNameSyntax =
            parameters.tagName instanceof TSDocTagName ? parameters.tagName :
            new TSDocTagName({ text: parameters.tagName }));
        this._parameterName = parameters.parameterName;
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.TSDocParamTag {
        return SyntaxKind.TSDocParamTag;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IBlockSyntax<TSDocParamTag> {
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
     * Gets or sets the parameter name for this block.
     */
    public get parameterName(): string {
        return this._parameterName || '';
    }

    public set parameterName(value: string) {
        if (this._parameterName !== value) {
            this.beforeChange();
            this._parameterName = value;
            this.afterChange();
        }
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
