import { BlockParser } from "../../../parser/BlockParser";
import { SyntaxKind } from "../../../nodes/SyntaxKind";
import { Token, TokenLike } from "../../../parser/Token";
import { MarkdownUtils } from "../../../utils/MarkdownUtils";
import { Scanner } from "../../../parser/Scanner";
import { MarkdownCodeBlock, ICodeFence } from "../../../nodes/MarkdownCodeBlock";
import { ContentWriter } from "../../../parser/ContentWriter";
import { Block } from "../../../nodes/Block";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { Preprocessor } from "../../../parser/Preprocessor";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IBlockSyntax } from "../../IBlockSyntax";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";
import { StringUtils } from "../../../utils/StringUtils";

export namespace MarkdownCodeBlockSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IBlockSyntax<MarkdownCodeBlock>
        & IHtmlEmittable<MarkdownCodeBlock>
        & ITSDocEmittable<MarkdownCodeBlock>
    >(MarkdownCodeBlockSyntax);

    // Special tokens for code blocks
    const backtickCodeFenceToken = Symbol("BacktickCodeFenceToken");    // `{3,}
    const tildeCodeFenceToken = Symbol("TildeCodeFenceToken");          // ~{3,}

    type CodeFence =
        | typeof backtickCodeFenceToken
        | typeof tildeCodeFenceToken
        ;

    function isCodeFence(token: TokenLike): token is CodeFence {
        return token === backtickCodeFenceToken
            || token === tildeCodeFenceToken;
    }

    function lookAheadHasBacktickOnCurrentLine(scanner: Scanner): boolean {
        for (;;) {
            switch (scanner.scan()) {
                case Token.NewLineTrivia:
                case Token.EndOfFileToken:
                    return false;
                case Token.BacktickToken:
                    return true;
            }
        }
    }

    function lookAheadHasOnlySpacesOnCurrentLine(scanner: Scanner): boolean {
        for (;;) {
            switch (scanner.scan()) {
                case Token.NewLineTrivia:
                case Token.EndOfFileToken:
                    return true;
                case Token.SpaceTrivia:
                    continue;
                default:
                    return false;
            }
        }
    }

    function rescanCodeFenceToken(scanner: Scanner, codeFence: ICodeFence | undefined): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#code-fence

        let fence: '`' | '~';
        let fenceChar: number;
        let fenceToken: TokenLike;
        switch (scanner.token()) {
            case Token.BacktickToken:
                fence = '`';
                fenceChar = CharacterCodes.backtick;
                fenceToken = backtickCodeFenceToken;
                break;
            case Token.TildeToken:
                fence = '~';
                fenceChar = CharacterCodes.tilde;
                fenceToken = tildeCodeFenceToken;
                break;
            default:
                return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);

        // A code fence must have at least 3 fence characters.
        const count: number | undefined = preprocessor.peekMinCount(0, 3, fenceChar);
        if (count === undefined) {
            return undefined;
        }

        preprocessor.advance(count);
        if (codeFence) {
            // scanning the end of a balanced pair of code fence tokens

            // The end fence token must match the start, must have an equal or greater
            // number of characters, and may have no other characters on the line.
            if (fence !== codeFence.fenceChar ||
                count < codeFence.fenceLength ||
                !scanner.lookAhead(lookAheadHasOnlySpacesOnCurrentLine)) {
                return undefined;
            }
        } else {
            // scanning the start of a balanced pair of code fence tokens

            // for a backtick code fence, no other backticks may be present on the line.
            if (fenceToken === backtickCodeFenceToken &&
                scanner.lookAhead(lookAheadHasBacktickOnCurrentLine)) {
                return undefined;
            }
        }
        return scanner.setToken(fenceToken);
    }

    interface ICodeBlockState {
        hasWrittenInfo?: boolean;
        content: ContentWriter;
    }

    function createCodeBlockState(): ICodeBlockState {
        return {
            content: new ContentWriter()
        };
    }

    function getState(parser: BlockParser, node: MarkdownCodeBlock): ICodeBlockState {
        return parser.getState(MarkdownCodeBlockSyntax, node, createCodeBlockState);
    }

    function tryParseCodeFence(parser: BlockParser): ICodeFence | undefined {
        const scanner: Scanner = parser.scanner;
        const token: TokenLike = scanner.rescan(rescanCodeFenceToken, /*codeFence*/ undefined);
        if (!isCodeFence(token)) {
            return undefined;
        }
        const codeFence: ICodeFence = {
            fenceChar: token === backtickCodeFenceToken ? '`' : '~',
            fenceLength: scanner.tokenLength,
            fenceOffset: parser.indent
        };
        Object.freeze(codeFence);
        scanner.scan();
        return codeFence;
    }

    function tryStartFencedCodeBlock(parser: BlockParser, container: Block): Block | undefined {
        // https://spec.commonmark.org/0.29/#fenced-code-blocks
        //
        // - A code fence is a sequence of at least three consecutive backtick characters
        //   (`) or tildes (~).
        // - Tildes and backticks cannot be mixed.
        // - A fenced code block begins with a code fence, indented no more than three spaces.
        const scanner: Scanner = parser.scanner;
        if (parser.indented) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const codeFence: ICodeFence | undefined = tryParseCodeFence(parser);
        if (!codeFence) {
            return undefined;
        }

        scanner.scanWhitespace();
        const node: MarkdownCodeBlock = new MarkdownCodeBlock({ pos, codeFence });
        parser.pushBlock(container, node);
        return node;
    }

    function tryStartIndentedCodeBlock(parser: BlockParser, container: Block): Block | undefined {
        // https://spec.commonmark.org/0.29/#indented-code-blocks

        if (!parser.indented ||
            parser.blank ||
            parser.current.kind === SyntaxKind.MarkdownParagraph) {
            return undefined;
        }

        const scanner: Scanner = parser.scanner;
        parser.retreatToIndentStart();
        scanner.scanColumns(4);

        const pos: number = scanner.startPos;
        const node: MarkdownCodeBlock = new MarkdownCodeBlock({ pos });
        parser.pushBlock(container, node);
        return node;
    }

    function tryContinueFencedCodeBlock(parser: BlockParser, block: MarkdownCodeBlock, codeFence: ICodeFence): boolean {
        const scanner: Scanner = parser.scanner;
        if (!parser.indented) {
            scanner.rescan(rescanCodeFenceToken, codeFence);
            if (scanner.expect(codeFence.fenceChar === '`' ? backtickCodeFenceToken : tildeCodeFenceToken)) {
                scanner.scanLine();
                parser.finish(block);
                block.end = scanner.startPos;
                return true;
            }
        }
        parser.retreatToIndentStart();
        let fenceOffset: number = codeFence.fenceOffset;
        while (fenceOffset > 0 && Token.isIndentCharacter(scanner.token())) {
            scanner.scanColumns(1);
            fenceOffset--;
        }
        return true;
    }

    function tryContinueIndentedCodeBlock(parser: BlockParser, block: MarkdownCodeBlock): boolean {
        const scanner: Scanner = parser.scanner;
        if (parser.indented) {
            parser.retreatToIndentStart();
            scanner.scanColumns(4);
        } else if (!parser.blank) {
            return false;
        }
        return true;
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
        return tryStartFencedCodeBlock(parser, container) ||
            tryStartIndentedCodeBlock(parser, container);
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
    export function tryContinueBlock(parser: BlockParser, block: MarkdownCodeBlock): boolean {
        return block.codeFence ?
            tryContinueFencedCodeBlock(parser, block, block.codeFence) :
            tryContinueIndentedCodeBlock(parser, block);
    }

    /**
     * Finishes the current block, performing any necessary block-level post-processing.
     * @param parser The parser used to parse the Block.
     * @param block The Block to finish.
     */
    export function finishBlock(parser: BlockParser, block: MarkdownCodeBlock): void {
        const { content } = getState(parser, block);
        block.literal = block.codeFence ? content.toString() : MarkdownUtils.trimBlankLines(content.toString());
    }

    /**
     * Accepts the remaining source text of the current line as a content line of the Block.
     * @param parser The parser used to parse the Block.
     * @param block The Block accepting the line.
     * @returns The Block the parser will set as the current Block. This is usually the input Block
     * however some parsers can change the current block if accepting the line finishes the block.
     */
    export function acceptLine(parser: BlockParser, block: MarkdownCodeBlock): Block {
        const scanner: Scanner = parser.scanner;
        const state: ICodeBlockState = getState(parser, block);
        if (block.codeFence && !state.hasWrittenInfo) {
            state.hasWrittenInfo = true;
            const text: string = scanner.scanLine();
            block.info = MarkdownUtils.unescapeString(text.trim());
        } else {
            state.content.addMapping(scanner.startPos);
            state.content.write(scanner.scanLine());
            if (Token.isLineEnding(scanner.token())) {
                state.content.write('\n');
            }
        }
        return block;
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: MarkdownCodeBlock): void {
        const info: string[] | undefined = node.info ? node.info.split(/\s+/) : [];
        const attrs: [string, string][] = [];
        if (info.length > 0 && info[0].length > 0) {
            attrs.push(['class', 'language-' + writer.escapeText(info[0])]);
        }
        writer.writeLine();
        writer.writeTag('pre');
        writer.writeTag('code', attrs);
        writer.write(node.literal);
        writer.writeTag('/code');
        writer.writeTag('/pre');
        writer.writeLine();
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownCodeBlock): void {
        if (node.codeFence) {
            writer.pushBlock({ indent: node.codeFence.fenceOffset });
            writer.write(StringUtils.repeat(node.codeFence.fenceChar, node.codeFence.fenceLength));
            if (node.info) {
                writer.write(' ');
                writer.write(node.info);
            }
            writer.writeLine();
            for (const line of node.literal.split(/\r\n?|\n/g)) {
                writer.write(line);
                writer.writeLine();
            }
            writer.write(StringUtils.repeat(node.codeFence.fenceChar, node.codeFence.fenceLength));
            writer.writeLine();
            writer.popBlock();
        }
        else {
            writer.pushBlock({ indent: 4 });
            for (const line of node.literal.split(/\r\n?|\n/g)) {
                writer.write(line);
                writer.writeLine();
            }
            writer.popBlock();
        }
    }
}
