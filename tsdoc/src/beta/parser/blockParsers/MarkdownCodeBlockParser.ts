import { StartResult, ContinueResult } from "./IBlockSyntaxParser";
import { BlockParser } from "../BlockParser";
import { SyntaxKind } from "../../nodes/SyntaxKind";
import { Token } from "../Token";
import { MarkdownUtils } from "../utils/MarkdownUtils";
import { MarkdownCodeBlockScanner } from "../scanners/MarkdownCodeBlockScanner";
import { Scanner } from "../Scanner";
import { Node } from "../../nodes/Node";
import { MarkdownCodeBlock, ICodeFence } from "../../nodes/MarkdownCodeBlock";
import { ContentWriter } from "../ContentWriter";

export namespace MarkdownCodeBlockParser {
    export const kind: SyntaxKind.MarkdownCodeBlock = SyntaxKind.MarkdownCodeBlock;

    function rescanCodeFenceStartToken(scanner: Scanner): Token | undefined {
        const token: Token = scanner.rescan(MarkdownCodeBlockScanner.rescanCodeFenceToken);
        // for a backtick code fence, no other backticks may be present on the line
        if (token !== Token.BacktickCodeFenceToken || !scanner.lookAhead(MarkdownCodeBlockScanner.lookAheadHasBacktickOnCurrentLine)) {
            return token;
        }
        return undefined;
    }

    export function tryStart(parser: BlockParser, _container: Node): StartResult {
        // https://spec.commonmark.org/0.29/#fenced-code-blocks
        //
        // - A code fence is a sequence of at least three consecutive backtick characters
        //   (`` ` ``) or tildes (`~`).
        // - Tildes and backticks cannot be mixed.
        // - A fenced code block begins with a code fence, indented no more than three spaces.
        const scanner: Scanner = parser.scanner;
        if (parser.indent <= 3) {
            const token: Token = scanner.rescan(rescanCodeFenceStartToken);
            if (Token.isCodeFence(token)) {
                const pos: number = scanner.startPos;
                const codeFence: ICodeFence = {
                    token,
                    length: parser.scanner.getTokenText().length,
                    fenceOffset: parser.indent
                };
                scanner.scan();
                scanner.scanWhitespace();
                parser.finishUnmatchedBlocks();
                parser.pushBlock(new MarkdownCodeBlock({ codeFence }), pos);
                return StartResult.Leaf;
            }
        } else {
            // https://spec.commonmark.org/0.29/#indented-code-blocks
            if ((!parser.tip || parser.tip.kind !== SyntaxKind.MarkdownParagraph) && !parser.blank) {
                parser.retreatToIndentStart();
                scanner.scanColumns(4);
                const pos: number = scanner.startPos;
                parser.finishUnmatchedBlocks();
                parser.pushBlock(new MarkdownCodeBlock(), pos);
                return StartResult.Leaf;
            }
            return StartResult.Unmatched;

        }
        return StartResult.Unmatched;
    }

    function rescanCodeFenceEndToken(scanner: Scanner, codeFence: ICodeFence): Token | undefined {
        const token: Token = scanner.rescan(MarkdownCodeBlockScanner.rescanCodeFenceToken);
        if (token === codeFence.token && scanner.getTokenText().length >= codeFence.length) {
            const hasOnlySpaces: boolean = scanner.lookAhead(MarkdownCodeBlockScanner.lookAheadHasOnlySpacesOnCurrentLine);
            if (hasOnlySpaces) {
                return token;
            }
        }
        return undefined;
    }

    export function tryContinue(parser: BlockParser, block: MarkdownCodeBlock): ContinueResult {
        const scanner: Scanner = parser.scanner;
        if (block.codeFence) {
            if (parser.indent <= 3) {
                const token: Token = scanner.rescan(rescanCodeFenceEndToken, block.codeFence);
                if (token === block.codeFence.token) {
                    scanner.scanLine();
                    parser.finish(block, scanner.startPos);
                    return ContinueResult.Finished;
                }
            }
            parser.retreatToIndentStart();
            let fenceOffset: number = block.codeFence.fenceOffset;
            while (fenceOffset > 0 && Token.isIndentCharacter(scanner.token())) {
                scanner.scanColumns(1);
                fenceOffset--;
            }
        } else {
            if (parser.indent >= 4) {
                parser.retreatToIndentStart();
                scanner.scanColumns(4);
            } else if (!parser.blank) {
                return ContinueResult.Unmatched;
            }
        }
        return ContinueResult.Matched;
    }

    export function finish(parser: BlockParser, block: MarkdownCodeBlock): void {
        const content: ContentWriter | undefined = parser.getParserState(block).content;
        if (block.codeFence) {
            parser.getParserState(block).literal = content ? content.toString() : "";
        } else {
            parser.getParserState(block).literal = content ? MarkdownUtils.trimBlankLines(content.toString()) : "";
        }
        parser.getParserState(block).content = undefined;
    }

    export function acceptLine(parser: BlockParser, block: MarkdownCodeBlock): void {
        const scanner: Scanner = parser.scanner;
        if (block.codeFence && parser.getParserState(block).info === undefined) {
            const text: string = scanner.scanLine();
            parser.getParserState(block).info = MarkdownUtils.unescapeString(text.trim());
            return;
        }

        let content: ContentWriter | undefined = parser.getParserState(block).content;
        if (!content) {
            parser.getParserState(block).content = content = new ContentWriter();
        }

        content.addMapping(scanner.startPos);
        content.write(scanner.scanLine());
        if (Token.isLineEnding(scanner.token())) {
            content.write("\n");
        }
    }
}
