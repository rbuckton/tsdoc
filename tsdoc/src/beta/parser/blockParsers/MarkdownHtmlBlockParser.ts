import { StartResult, ContinueResult } from "./IBlockSyntaxParser";
import { BlockParser } from "../BlockParser";
import { SyntaxKind } from "../../nodes/SyntaxKind";
import { Token } from "../Token";
import { IScannerState, Scanner } from "../Scanner";
import { HtmlUtils } from "../utils/HtmlUtils";
import { MarkdownHtmlScanner } from "../scanners/MarkdownHtmlScanner";
import { ContentWriter } from "../ContentWriter";
import { MarkdownHtmlBlock } from "../../nodes/MarkdownHtmlBlock";
import { Node } from "../../nodes/Node";

export enum MarkdownHtmlBlockType {
    ScriptOrPreOrStyle,
    Comment,
    ProcessingInstruction,
    Declaration,
    CharacterData,
    BlockTag,
    StandaloneTag,
}

export namespace MarkdownHtmlBlockParser {
    export const kind: SyntaxKind.MarkdownHtmlBlock = SyntaxKind.MarkdownHtmlBlock;

    function createHtmlBlock(parser: BlockParser, blockType: MarkdownHtmlBlockType): MarkdownHtmlBlock {
        const block: MarkdownHtmlBlock = new MarkdownHtmlBlock();
        parser.getParserState(block).htmlBlockType = blockType;
        return block;
    }

    export function tryStart(parser: BlockParser, container: Node): StartResult {
        // https://spec.commonmark.org/0.29/#html-blocks
        const scanner: Scanner = parser.scanner;
        if (parser.indent <= 3 && scanner.token() === Token.LessThanToken) {
            const indentState: IScannerState = parser.indentStartState || scanner.getState();
            const pos: number = parser.indentStartPos;
            const token: Token = scanner.rescan(MarkdownHtmlScanner.rescanHtmlStartToken);
            switch (token) {
                case Token.HtmlCommentStartToken:
                    // case 2: `<!--`
                    parser.finishUnmatchedBlocks();
                    parser.pushBlock(createHtmlBlock(parser, MarkdownHtmlBlockType.Comment), pos);
                    scanner.setState(indentState);
                    return StartResult.Leaf;
                case Token.HtmlProcessingInstructionStartToken:
                    // case 3: `<?`
                    parser.finishUnmatchedBlocks();
                    parser.pushBlock(createHtmlBlock(parser, MarkdownHtmlBlockType.ProcessingInstruction), pos);
                    scanner.setState(indentState);
                    return StartResult.Leaf;
                case Token.HtmlDeclarationStartToken:
                    // case 4: `<!` followed by [A-Z]
                    parser.finishUnmatchedBlocks();
                    parser.pushBlock(createHtmlBlock(parser, MarkdownHtmlBlockType.Declaration), pos);
                    scanner.setState(indentState);
                    return StartResult.Leaf;
                case Token.HtmlCharacterDataStartToken:
                    // case 5: `<![CDATA[`
                    parser.finishUnmatchedBlocks();
                    parser.pushBlock(createHtmlBlock(parser, MarkdownHtmlBlockType.CharacterData), pos);
                    scanner.setState(indentState);
                    return StartResult.Leaf;
                case Token.HtmlEndTagStartToken:
                case Token.LessThanToken: {
                    // case 1: `<script`, `<pre`, or `<style` followed by whitespace, `>` or `\n`.
                    // case 6: `<` or `</` followed by address, article, ...
                    // case 7: any stand-alone full html tag on a single line.
                    const state: IScannerState = scanner.getState();
                    scanner.scan();
                    if (scanner.rescan(MarkdownHtmlScanner.rescanHtmlTagName) === Token.HtmlTagName) {
                        const tagName: string = scanner.getTokenText().toLowerCase();
                        scanner.scan();
                        // case 1: `<script`, `<pre`, or `<style` followed by whitespace, `>`, or `\n`.
                        if (token === Token.LessThanToken &&
                            (tagName === "script" || tagName === "pre" || tagName === "style") &&
                            (Token.isWhitespaceCharacter(scanner.token()) || scanner.token() === Token.GreaterThanToken || Token.isLineEnding(scanner.token()))) {
                            parser.finishUnmatchedBlocks();
                            parser.pushBlock(createHtmlBlock(parser, MarkdownHtmlBlockType.ScriptOrPreOrStyle), pos);
                            scanner.setState(indentState);
                            return StartResult.Leaf;
                        }
                        // case 6: `<` or `</`, followed by a known block tag, followed by whitespace, `>`, `/>`, or `\n`
                        if (HtmlUtils.isKnownHtmlBlockTag(tagName)) {
                            scanner.rescan(MarkdownHtmlScanner.rescanHtmlEndToken);
                            if (Token.isWhitespaceCharacter(scanner.token()) ||
                                Token.isLineEnding(scanner.token()) ||
                                scanner.token() === Token.GreaterThanToken ||
                                scanner.token() === Token.HtmlSelfClosingTagEndToken) {
                                parser.finishUnmatchedBlocks();
                                parser.pushBlock(createHtmlBlock(parser, MarkdownHtmlBlockType.BlockTag), pos);
                                scanner.setState(indentState);
                                return StartResult.Leaf;
                            }
                        }
                        // case 7: any stand-alone full html tag on a single line.
                        if (container.kind !== SyntaxKind.MarkdownParagraph &&
                            (token === Token.HtmlEndTagStartToken || tagName !== "script" && tagName !== "pre" && tagName !== "style")) {
                            // scan past attributes
                            let hasWhitespaceSeperator: boolean = scanner.scanWhitespace();
                            let hasInvalidAttributes: boolean = false;
                            if (token === Token.LessThanToken) {
                                while (hasWhitespaceSeperator) {
                                    if (scanner.rescan(MarkdownHtmlScanner.rescanHtmlAttributeName) !== Token.HtmlAttributeName) {
                                        break;
                                    }
                                    scanner.scan();
                                    hasWhitespaceSeperator = scanner.scanWhitespace();
                                    if (scanner.token() === Token.EqualsToken) {
                                        scanner.scan();
                                        scanner.scanWhitespace();
                                        if (!Token.isHtmlAttributeValue(scanner.rescan(MarkdownHtmlScanner.rescanHtmlAttributeValue, /*singleLine*/ true))) {
                                            hasInvalidAttributes = true;
                                            break;
                                        }
                                        scanner.scan();
                                        hasWhitespaceSeperator = scanner.scanWhitespace();
                                    }
                                }
                            }
                            if (!hasInvalidAttributes) {
                                scanner.rescan(MarkdownHtmlScanner.rescanHtmlEndToken);
                                if (scanner.token() === Token.GreaterThanToken ||
                                    scanner.token() === Token.HtmlSelfClosingTagEndToken) {
                                    scanner.scan();
                                    scanner.scanWhitespace();
                                    if (Token.isLineEnding(scanner.token())) {
                                        parser.finishUnmatchedBlocks();
                                        parser.pushBlock(createHtmlBlock(parser, MarkdownHtmlBlockType.StandaloneTag), pos);
                                        scanner.setState(indentState);
                                        return StartResult.Leaf;
                                    }
                                }
                            }
                        }
                    }
                    scanner.setState(state);
                    break;
                }
            }
        }
        return StartResult.Unmatched;
    }

    export function tryContinue(parser: BlockParser, block: MarkdownHtmlBlock): ContinueResult {
        return parser.blank && (
            parser.getParserState(block).htmlBlockType === MarkdownHtmlBlockType.BlockTag ||
            parser.getParserState(block).htmlBlockType === MarkdownHtmlBlockType.StandaloneTag) ?
            ContinueResult.Unmatched :
            ContinueResult.Matched;
    }

    export function finish(parser: BlockParser, block: MarkdownHtmlBlock): void {
        const content: ContentWriter | undefined = parser.getParserState(block).content;
        parser.getParserState(block).literal = content ?
            content.toString().replace(/(\n *)+$/, '') :
            "";
        parser.getParserState(block).content = undefined;
    }

    const htmlBlockCloseRegExps: RegExp[] = [
        /<\/(?:script|pre|style)>/i,
        /-->/,
        /\?>/,
        />/,
        /\]\]>/
    ];

    export function acceptLine(parser: BlockParser, block: MarkdownHtmlBlock): void {
        parser.retreatToIndentStart();

        const scanner: Scanner = parser.scanner;
        let content: ContentWriter | undefined = parser.getParserState(block).content;
        if (!content) {
            content = parser.getParserState(block).content = new ContentWriter();
        }

        const line: string = scanner.scanLine();
        content.addMapping(scanner.startPos);
        content.write(line);
        if (scanner.token() === Token.NewLineTrivia) {
            content.write("\n");
        }

        const blockType: MarkdownHtmlBlockType | undefined = parser.getParserState(block).htmlBlockType;
        if (blockType !== undefined &&
            blockType >= MarkdownHtmlBlockType.ScriptOrPreOrStyle &&
            blockType <= MarkdownHtmlBlockType.CharacterData &&
            htmlBlockCloseRegExps[blockType].test(line)) {
            parser.finish(block, scanner.startPos);
        }
    }
}