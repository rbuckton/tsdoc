import { BlockParser } from "../../../parser/BlockParser";
import { Token } from "../../../parser/Token";
import { ContentWriter } from "../../../parser/ContentWriter";
import { MarkdownParagraph } from "../../../nodes/MarkdownParagraph";
import { Scanner } from "../../../parser/Scanner";
import { InlineParser } from "../../../parser/InlineParser";
import { IMapping } from "../../../parser/Mapper";
import { Block } from "../../../nodes/Block";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IBlockSyntax } from "../../IBlockSyntax";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { Node } from "../../../nodes/Node";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";

export namespace MarkdownParagraphSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IBlockSyntax<MarkdownParagraph>
        & IHtmlEmittable<MarkdownParagraph>
        & ITSDocEmittable<MarkdownParagraph>
    >(MarkdownParagraphSyntax);

    interface IParagraphState {
        content: ContentWriter;
    }

    function createParagraphState(): IParagraphState {
        return { content: new ContentWriter() };
    }

    function getState(parser: BlockParser, node: MarkdownParagraph): IParagraphState {
        return parser.getState(MarkdownParagraphSyntax, node, createParagraphState);
    }

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
    export function tryStartBlock(parser: BlockParser, container: Block): Block | undefined {
        // Paragraphs are started automatically in containers that do not accept lines.
        return undefined;
    }

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
    export function tryContinueBlock(parser: BlockParser, _block: MarkdownParagraph): boolean {
        // Paragraphs are broken by two or more line terminators.
        return !parser.blank;
    }

    /**
     * Finishes the current block, performing any necessary block-level post-processing.
     * @param parser The parser used to parse the Block.
     * @param block The Block to finish.
     */
    export function finishBlock(parser: BlockParser, block: MarkdownParagraph): void {
        const state: IParagraphState = getState(parser, block);
        if (state.content) {
            parseReferences(parser, block);
            if (!state.content || state.content.length === 0) {
                block.removeNode();
            }
        }
    }

    /**
     * Accepts the remaining source text of the current line as a content line of the Block.
     * @param parser The parser used to parse the Block.
     * @param block The Block accepting the line.
     * @returns The Block the parser will set as the current Block. This is usually the input Block
     * however some parsers can change the current block if accepting the line finishes the block.
     */
    export function acceptLine(parser: BlockParser, block: MarkdownParagraph): Block {
        parser.acceptIndent();

        const state: IParagraphState = getState(parser, block);
        const scanner: Scanner = parser.scanner;
        state.content.addMapping(scanner.startPos);
        state.content.write(scanner.scanLine());
        if (scanner.token() === Token.NewLineTrivia) {
            state.content.write('\n');
        }
        block.end = scanner.startPos;
        return block;
    }

    /**
     * Gets the ContentWriter for the provided Block, if one exists.
     * @param parser The parser used to parse the Block.
     * @param block The Block from which to acquire a ContentWriter.
     * @returns The ContentWriter for the Block, if it exists; otherwise, `undefined`.
     */
    export function getContent(parser: BlockParser, block: MarkdownParagraph): ContentWriter {
        return getState(parser, block).content;
    }

    export function parseReferences(parser: BlockParser, block: MarkdownParagraph, output?: ContentWriter): void {
        const { content } = getState(parser, block);
        if (content.length) {
            const text: string = content.toString();
            const mappings: IMapping[] = content.mappings;
            const inlineParser: InlineParser = new InlineParser(parser.document, text, mappings, parser.gfm);
            for (const linkReference of inlineParser.parseReferences()) {
                block.insertSiblingBefore(linkReference);
            }

            const scanner: Scanner = inlineParser.scanner;
            if (scanner.startPos === 0) {
                // nothing was parsed
                if (output) {
                    output.copyFrom(content);
                }
                return;
            }

            content.clear();
            if (scanner.token() === Token.EndOfFileToken) {
                // nothing remains
                return;
            }

            if (!output) {
                output = content;
            }

            // write remaining non-reference content.
            let sourcePos: number = scanner.startPos;
            output.addMapping(scanner.startPos);
            for (const sourceSegment of mappings) {
                if (sourceSegment.sourcePos > sourcePos) {
                    output.write(scanner.slice(sourcePos, sourceSegment.sourcePos));
                    output.addMapping(sourceSegment.sourcePos);
                    sourcePos = sourceSegment.sourcePos;
                }
            }

            output.write(scanner.slice(sourcePos));
        }
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: MarkdownParagraph): void {
        const parent: Node | undefined = node.parent;
        const tight: boolean = !!parent && parent.isListItem() && parent.listMarker.tight;
        if (!tight) {
            writer.writeLine();
            writer.writeTag('p');
        }
        writer.writeContents(node);
        if (!tight) {
            writer.writeTag('/p');
            writer.writeLine();
        }
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownParagraph): void {
        writer.writeContents(node);
        writer.writeln();
    }
}
