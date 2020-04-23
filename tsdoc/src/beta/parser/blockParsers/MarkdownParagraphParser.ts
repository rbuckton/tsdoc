import { StartResult, ContinueResult } from "./IBlockSyntaxParser";
import { BlockParser } from "../BlockParser";
import { SyntaxKind } from "../../nodes/SyntaxKind";
import { Token } from "../Token";
import { ContentWriter } from "../ContentWriter";
import { Node } from "../../nodes/Node";
import { MarkdownParagraph } from "../../nodes/MarkdownParagraph";
import { Scanner } from "../Scanner";
import { InlineParser } from "../InlineParser";
import { IMapping } from "../Preprocessor";

export namespace MarkdownParagraphParser {
    export const kind: SyntaxKind.MarkdownParagraph = SyntaxKind.MarkdownParagraph;

    interface IParagraphState {
        content: ContentWriter;
    }

    function createParagraphState(): IParagraphState {
        return {
            content: new ContentWriter()
        };
    }

    function getState(parser: BlockParser, node: MarkdownParagraph): IParagraphState {
        return parser.getState(MarkdownParagraphParser, node, createParagraphState);
    }

    export function tryStart(_parser: BlockParser, _container: Node): StartResult {
        // Paragraphs are started automatically in containers that do not accept lines.
        return StartResult.Unmatched;
    }

    export function tryContinue(parser: BlockParser, _block: MarkdownParagraph): ContinueResult {
        // Paragraphs are broken by two or more line terminators.
        return parser.blank ? ContinueResult.Unmatched : ContinueResult.Matched;
    }

    export function acceptLine(parser: BlockParser, block: MarkdownParagraph): void {
        parser.acceptIndent();

        const state: IParagraphState = getState(parser, block);
        const scanner: Scanner = parser.scanner;
        state.content.addMapping(scanner.startPos);
        state.content.write(scanner.scanLine());
        if (scanner.token() === Token.NewLineTrivia) {
            state.content.write("\n");
        }
    }

    export function getContent(parser: BlockParser, block: MarkdownParagraph): ContentWriter | undefined {
        return getState(parser, block).content;
    }

    export function parseReferences(parser: BlockParser, block: MarkdownParagraph): void {
        const state: IParagraphState = getState(parser, block);
        if (state.content && state.content.length) {
            const text: string = state.content.toString();
            const mappings: IMapping[] = state.content.mappings;
            const inlineParser: InlineParser = new InlineParser(parser.document, text, mappings);
            for (const linkReference of inlineParser.parseReferences()) {
                block.insertSiblingBefore(linkReference);
            }

            const scanner: Scanner = inlineParser.scanner;
            if (scanner.startPos === 0) {
                // nothing was parsed
                return;
            }

            if (scanner.token() === Token.EndOfFileToken) {
                // nothing remains
                state.content.clear();
                return;
            }

            // write remaining non-reference content.
            let sourcePos: number = scanner.startPos;
            state.content = new ContentWriter();
            state.content.addMapping(scanner.startPos);
            for (const sourceSegment of mappings) {
                if (sourceSegment.sourcePos > sourcePos) {
                    state.content.write(scanner.slice(sourcePos, sourceSegment.sourcePos));
                    state.content.addMapping(sourceSegment.sourcePos);
                    sourcePos = sourceSegment.sourcePos;
                }
            }

            state.content.write(scanner.slice(sourcePos));
        }
    }

    export function finish(parser: BlockParser, block: MarkdownParagraph): void {
        const state: IParagraphState = getState(parser, block);
        if (state.content) {
            parseReferences(parser, block);
            if (!state.content || state.content.length === 0) {
                block.removeNode();
            }
        }
    }
}
