import { StartResult, ContinueResult } from "./IBlockSyntaxParser";
import { BlockParser } from "../BlockParser";
import { SyntaxKind } from "../nodes/SyntaxKind";
import { Token } from "../Token";
import { ContentWriter } from "../ContentWriter";
import { Node } from "../nodes/Node";
import { MarkdownParagraph } from "../nodes/MarkdownParagraph";
import { Scanner } from "../Scanner";

export namespace MarkdownParagraphParser {
    export const kind: SyntaxKind.MarkdownParagraph = SyntaxKind.MarkdownParagraph;

    export function tryStart(_parser: BlockParser, _container: Node): StartResult {
        // Paragraphs are started automatically in containers that do not accept lines.
        return StartResult.Unmatched;
    }

    export function tryContinue(parser: BlockParser, _block: MarkdownParagraph): ContinueResult {
        // Paragraphs are broken by two or more line terminators.
        return parser.blank ? ContinueResult.Unmatched : ContinueResult.Matched;
    }

    export function finish(parser: BlockParser, block: MarkdownParagraph): void {
        if (parser.getParserState(block).content) {
            parser.parseReferences(block);
            const newContent: ContentWriter | undefined = parser.getParserState(block).content;
            if (!newContent || newContent.length === 0) {
                block.removeNode();
            }
        }
    }

    export function acceptLine(parser: BlockParser, block: MarkdownParagraph): void {
        parser.acceptIndent();

        const scanner: Scanner = parser.scanner;
        let content: ContentWriter | undefined = parser.getParserState(block).content;
        if (!content) {
            parser.getParserState(block).content = content = new ContentWriter();
        }

        content.addMapping(scanner.startPos);
        content.write(scanner.scanLine());
        if (scanner.token() === Token.NewLineTrivia) {
            content.write("\n");
        }
    }
}
