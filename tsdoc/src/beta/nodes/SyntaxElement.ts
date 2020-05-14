import { Node, INodeParameters } from "./Node";
import { ISyntaxElementSyntax } from "../syntax/ISyntaxElementSyntax";

export interface ISyntaxParameters extends INodeParameters {
}

export abstract class SyntaxElement extends Node {
    // @ts-ignore
    private _syntaxBrand: never;

    public constructor(parameters?: ISyntaxParameters) {
        super(parameters);
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public abstract get syntax(): ISyntaxElementSyntax<SyntaxElement>;

    /**
     * {@inheritDoc Node.isSyntaxElement()}
     * @override
     */
    public isSyntaxElement(): true {
        return true;
    }
}
