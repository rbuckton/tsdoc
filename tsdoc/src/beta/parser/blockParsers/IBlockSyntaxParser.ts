import { BlockParser } from "../BlockParser";
import { Block } from "../../nodes/Block";
import { ContentWriter } from "../ContentWriter";

export const enum StartResult {
    Unmatched = 0,  // Block was not started
    Container = 1,  // Block started a new container
    Leaf = 2        // Block started a new leaf
}

export const enum ContinueResult {
    Matched = 0,    // Block was continued
    Unmatched = 1,  // Block was not continued
    Finished = 2,   // Block finished the line
}

export interface IBlockSyntaxParser<T extends Block> {
    readonly kind: T["kind"];
    tryStart(parser: BlockParser, container: Block): StartResult;
    tryContinue(parser: BlockParser, block: T): ContinueResult;
    finish(parser: BlockParser, block: T): void;
    acceptLine?(parser: BlockParser, block: T): void;
    getContent?(parser: BlockParser, block: T): ContentWriter | undefined;
}
