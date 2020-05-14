import { BlockParser } from "../../../parser/BlockParser";
import { Token, TokenLike } from "../../../parser/Token";
import { Scanner } from "../../../parser/Scanner";
import { MarkdownThematicBreak } from "../../../nodes/MarkdownThematicBreak";
import { Block } from "../../../nodes/Block";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { Preprocessor } from "../../../parser/Preprocessor";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IBlockSyntax } from "../../IBlockSyntax";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";
import { StringUtils } from "../../../utils/StringUtils";

export namespace MarkdownThematicBreakSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IBlockSyntax<MarkdownThematicBreak>
        & IHtmlEmittable<MarkdownThematicBreak>
        & ITSDocEmittable<MarkdownThematicBreak>
    >(MarkdownThematicBreakSyntax);

    // Special tokens for thematic breaks
    const asteriskThematicBreakToken = Symbol("AsteriskThematicBreakToken");        // ***
    const minusThematicBreakToken = Symbol("MinusThematicBreakToken");              // ---
    const underscoreThematicBreakToken = Symbol("UnderscoreThematicBreakToken");    // ___

    type ThematicBreak =
        | typeof asteriskThematicBreakToken
        | typeof minusThematicBreakToken
        | typeof underscoreThematicBreakToken
        ;

    function isThematicBreak(token: TokenLike): token is ThematicBreak {
        return token === asteriskThematicBreakToken
            || token === minusThematicBreakToken
            || token === underscoreThematicBreakToken;
    }

    function rescanThematicBreakToken(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#thematic-break
        let breakChar: number;
        let breakToken: TokenLike;
        switch (scanner.token()) {
            case Token.AsteriskToken:
                breakChar = CharacterCodes.asterisk
                breakToken = asteriskThematicBreakToken;
                break;
            case Token.UnderscoreToken:
                breakChar = CharacterCodes._
                breakToken = underscoreThematicBreakToken;
                break;
            case Token.MinusToken:
                breakChar = CharacterCodes.minus
                breakToken = minusThematicBreakToken;
                break;
            default:
                return undefined;
        }
        const preprocessor: Preprocessor = scanner.preprocessor;
        let breakLookAhead: number = 0;
        let spaceLookAhead: number = 0;
        for (;;) {
            const spaceCount: number = preprocessor.peekCount(spaceLookAhead + breakLookAhead, UnicodeUtils.isSpaceOrTab);
            spaceLookAhead += spaceCount;

            const breakCount: number = preprocessor.peekCount(spaceLookAhead + breakLookAhead, breakChar);
            if (breakCount === 0) {
                break;
            }

            breakLookAhead += breakCount;
        }
        if (breakLookAhead >= 2 && preprocessor.peekIsAny(breakLookAhead + spaceLookAhead,
            CharacterCodes.lineFeed,
            undefined /*EOF*/)) {
            preprocessor.advance(breakLookAhead + spaceLookAhead);
            return scanner.setToken(breakToken);
        }
        return undefined;
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
        // https://spec.commonmark.org/0.29/#thematic-breaks
        //
        // - A line consisting of 0-3 spaces of indentation, followed by a sequence of three or more matching
        //   `-`, `_`, or `*` characters, each followed optionally by any number of spaces or tabs, forms a thematic break.
        if (parser.indented) {
            return undefined;
        }

        const scanner: Scanner = parser.scanner;
        const token: TokenLike = scanner.rescan(rescanThematicBreakToken);
        if (!isThematicBreak(token)) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        scanner.scanWhitespace();
        if (!Token.isLineEnding(scanner.scan())) {
            return undefined;
        }

        const style: '*' | '-' | '_' = 
            token === asteriskThematicBreakToken ? '*' :
            token === minusThematicBreakToken ? '-' :
            '_';

        const node: MarkdownThematicBreak = new MarkdownThematicBreak({ pos, end, style });
        parser.pushBlock(container, node);
        return node;
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
    export function tryContinueBlock(parser: BlockParser, block: MarkdownThematicBreak): boolean {
        // Thematic breaks cannot match more than one line.
        return false;
    }

    /**
     * Finishes the current block, performing any necessary block-level post-processing.
     * @param parser The parser used to parse the Block.
     * @param block The Block to finish.
     */
    export function finishBlock(parser: BlockParser, block: MarkdownThematicBreak): void {
        // Thematic breaks have no finish behavior.
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: MarkdownThematicBreak): void {
        writer.writeLine();
        writer.writeTag('hr', [], true);
        writer.writeLine();
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownThematicBreak): void {
        writer.write(StringUtils.repeat(node.style, 3));
        writer.writeln();
    }
}
