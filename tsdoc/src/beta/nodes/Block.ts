import { Content, IContentParameters } from "./Content";
import { IBlockSyntax } from "../syntax/IBlockSyntax";

export interface IBlockParameters extends IContentParameters {
}

export abstract class Block extends Content {
    // @ts-ignore
    private _blockBrand: never;

    public constructor(parameters?: IBlockParameters) {
        super(parameters);
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public abstract get syntax(): IBlockSyntax<Block>;

    /**
     * @override
     */
    public isBlock(): true {
        return true;
    }
}
