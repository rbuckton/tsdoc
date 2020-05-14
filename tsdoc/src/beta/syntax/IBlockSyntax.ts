import { BlockParser } from "../parser/BlockParser";
import { Block } from "../nodes/Block";
import { ContentWriter } from "../parser/ContentWriter";

export interface IBlockSyntax<T extends Block> {
    /**
     * Attempts to start a new Block syntax at the current token.
     *
     * NOTE: This function should be executed inside of a call to BlockParser.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param parser The parser used to parse the Block.
     * @param container The containing Block for the current token.
     * @returns A new Block if the block was started; otherwise, `undefined`.
     */
    tryStartBlock(parser: BlockParser, container: Block): Block | undefined;
    /**
     * Attempts to continue an existing Block syntax on a subsequent line.
     *
     * NOTE: This function should be executed inside of a call to BlockParser.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param parser The parser used to parse the Block.
     * @param block The Block to continue.
     * @returns `true` if the Block was continued; otherwise, `false`.
     */
    tryContinueBlock(parser: BlockParser, block: T): boolean;
    /**
     * Finishes the current block, performing any necessary block-level post-processing.
     * @param parser The parser used to parse the Block.
     * @param block The Block to finish.
     */
    finishBlock(parser: BlockParser, block: T): void;
    /**
     * Accepts the remaining source text of the current line as a content line of the Block.
     * @param parser The parser used to parse the Block.
     * @param block The Block accepting the line.
     * @returns The Block the parser will set as the current Block. This is usually the input Block
     * however some parsers can change the current block if accepting the line finishes the block.
     */
    acceptLine?(parser: BlockParser, block: T): Block;
    /**
     * Gets the ContentWriter for the provided Block, if one exists.
     * @param parser The parser used to parse the Block.
     * @param block The Block from which to acquire a ContentWriter.
     * @returns The ContentWriter for the Block, if it exists; otherwise, `undefined`.
     */
    getContent?(parser: BlockParser, block: T): ContentWriter | undefined;
}