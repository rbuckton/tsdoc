import { Inline, IInlineParameters } from "./Inline";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { InlineChildMixin } from "./mixins/InlineChildMixin";
import { InlineSiblingMixin } from "./mixins/InlineSiblingMixin";
import { SyntaxKind } from "./SyntaxKind";
import { IInlineSyntax } from "../syntax/IInlineSyntax";
import { TSDocInlineTagSyntax } from "../syntax/tsdoc/inlines/TSDocInlineTagSyntax";
import { TSDocTagName } from "./TSDocTagName";
import { SyntaxElement } from "./SyntaxElement";
import { IInlineContainerParameters, InlineContainerMixin } from "./mixins/InlineContainerMixin";
import { ContentUtils } from "../utils/ContentUtils";

export interface ITSDocInlineTagParameters extends IInlineParameters, IInlineContainerParameters {
    tagName?: TSDocTagName | string;
    destination?: string;
}

export class TSDocInlineTag extends mixin(Inline, [
    BlockChildMixin,
    InlineChildMixin,
    InlineSiblingMixin,
    InlineContainerMixin,
]) {
    private _tagNameSyntax: TSDocTagName;
    private _destination: string | undefined;

    public constructor(parameters: ITSDocInlineTagParameters = {}) {
        super(parameters);
        this.attachSyntax(this._tagNameSyntax =
            parameters.tagName instanceof TSDocTagName ? parameters.tagName :
            new TSDocTagName({ text: parameters.tagName }));
        this._destination = parameters.destination;
        ContentUtils.appendContent(this, parameters.content);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.TSDocInlineTag {
        return SyntaxKind.TSDocInlineTag;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IInlineSyntax {
        return TSDocInlineTagSyntax;
    }

    /**
     * Gets or sets the TSDoc tag name for this node.
     */
    public get tagName(): string {
        return this._tagNameSyntax.text;
    }

    public set tagName(value: string) {
        this._tagNameSyntax.text = value;
    }

    /**
     * Gets or sets the destination for the tag.
     */
    public get destination(): string {
        return this._destination || '';
    }

    public set destination(value: string) {
        if (this._destination !== value) {
            this.beforeChange();
            this._destination = value;
            this.afterChange();
        }
    }

    /**
     * {@inheritdoc Node.getSyntaxElements()}
     * @override
     */
    public getSyntaxElements(): ReadonlyArray<SyntaxElement> {
        return [this._tagNameSyntax];
    }
}
