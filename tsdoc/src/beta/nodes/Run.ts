import { Inline } from "./Inline";
import { SyntaxKind } from "./SyntaxKind";
import { INodeParameters } from "./Node";
import { IInlineSyntax } from "../syntax/IInlineSyntax";
import { RunSyntax } from "../syntax/commonmark/inline/RunSyntax";
import { IHtmlEmittable } from "../syntax/IHtmlEmittable";
import { mixin } from "../mixin";
import { BlockChildMixin } from "./mixins/BlockChildMixin";
import { InlineChildMixin } from "./mixins/InlineChildMixin";
import { InlineSiblingMixin } from "./mixins/InlineSiblingMixin";

export interface IRunParameters extends INodeParameters {
    text?: string;
}

export class Run extends mixin(Inline, [
    BlockChildMixin,
    InlineChildMixin,
    InlineSiblingMixin,
]) {
    private _text: string;

    public constructor(parameters?: IRunParameters) {
        super(parameters);
        this._text = parameters && parameters.text !== undefined ? parameters.text : "";
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.Run {
        return SyntaxKind.Run;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IInlineSyntax & IHtmlEmittable<Run> {
        return RunSyntax;
    }

    /**
     * Gets or sets the text for the run.
     */
    public get text(): string {
        return this._text;
    }

    public set text(value: string) {
        this._text = value;
    }
}
