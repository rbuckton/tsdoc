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

    interface IHtmlBlockState {
        content?: ContentWriter;
        htmlBlockType?: MarkdownHtmlBlockType;
    }

    function createHtmlBlockState(): IHtmlBlockState {
        return {};
    }

    function getState(parser: BlockParser, node: MarkdownHtmlBlock): IHtmlBlockState {
        return parser.getState(MarkdownHtmlBlockParser, node, createHtmlBlockState);
    }

    function createHtmlBlock(parser: BlockParser, blockType: MarkdownHtmlBlockType): MarkdownHtmlBlock {
        const block: MarkdownHtmlBlock = new MarkdownHtmlBlock();
        getState(parser, block).htmlBlockType = blockType;
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
        const state: IHtmlBlockState = getState(parser, block);
        return parser.blank && (
            state.htmlBlockType === MarkdownHtmlBlockType.BlockTag ||
            state.htmlBlockType === MarkdownHtmlBlockType.StandaloneTag) ?
            ContinueResult.Unmatched :
            ContinueResult.Matched;
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

        const state: IHtmlBlockState = getState(parser, block);
        const scanner: Scanner = parser.scanner;
        if (!state.content) {
            state.content = new ContentWriter();
        }

        const line: string = scanner.scanLine();
        state.content.addMapping(scanner.startPos);
        state.content.write(line);
        if (scanner.token() === Token.NewLineTrivia) {
            state.content.write("\n");
        }

        const blockType: MarkdownHtmlBlockType | undefined = state.htmlBlockType;
        if (blockType !== undefined &&
            blockType >= MarkdownHtmlBlockType.ScriptOrPreOrStyle &&
            blockType <= MarkdownHtmlBlockType.CharacterData &&
            htmlBlockCloseRegExps[blockType].test(line)) {
            parser.finish(block, scanner.startPos);
        }
    }

    export function finish(parser: BlockParser, block: MarkdownHtmlBlock): void {
        const state: IHtmlBlockState = getState(parser, block);
        block.literal = state.content ? state.content.toString().replace(/(\n *)+$/, '') : '';
        state.content = undefined;
    }
}
