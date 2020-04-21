import { Node, INodeParameters } from "./Node";

export interface ISyntaxParameters extends INodeParameters {
}

export abstract class Syntax extends Node {
    // @ts-ignore
    private _syntaxBrand: never;

    public constructor(parameters?: ISyntaxParameters) {
        super(parameters);
    }

    public isSyntax(): true {
        return true;
    }
}
