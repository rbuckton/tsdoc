import { INodeParameters } from "./Node";
// import { Block } from "./Block";
import { Content, IContentParameters } from "./Content";
import { IInlineSyntax } from "../syntax/IInlineSyntax";

export interface IInlineParameters extends IContentParameters {
}

export abstract class Inline extends Content {
    // @ts-ignore
    private _inlineBrand: never;

    constructor(parameters?: INodeParameters) {
        super(parameters);
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public abstract get syntax(): IInlineSyntax;

    /**
     * {@inheritdoc Node.isInline()}
     * @override
     */
    public isInline(): true {
        return true;
    }
}