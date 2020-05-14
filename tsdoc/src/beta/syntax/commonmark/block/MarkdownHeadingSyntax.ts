import { BlockParser } from "../../../parser/BlockParser";
import { SyntaxKind } from "../../../nodes/SyntaxKind";
import { Token, TokenLike } from "../../../parser/Token";
import { ContentWriter } from "../../../parser/ContentWriter";
import { Scanner } from "../../../parser/Scanner";
import { MarkdownHeading } from "../../../nodes/MarkdownHeading";
import { MarkdownParagraph } from "../../../nodes/MarkdownParagraph";
import { Block } from "../../../nodes/Block";
import { MarkdownParagraphSyntax } from "./MarkdownParagraphSyntax";
import { Preprocessor } from "../../../parser/Preprocessor";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IBlockSyntax } from "../../IBlockSyntax";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";
import { StringUtils } from "../../../utils/StringUtils";

export namespace MarkdownHeadingSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IBlockSyntax<MarkdownHeading>
        & IHtmlEmittable<MarkdownHeading>
        & ITSDocEmittable<MarkdownHeading>
    >(MarkdownHeadingSyntax);

    // Special tokens for headings
    const atxHeadingToken = Symbol("AtxHeadingToken");                      // #{1,6}
    const equalsSetextHeadingToken = Symbol("EqualsSetextHeadingToken");    // =====
    const minusSetextHeadingToken = Symbol("MinusSetextHeadingToken");      // -----

    type SetextHeading =
        | typeof equalsSetextHeadingToken
        | typeof minusSetextHeadingToken
        ;

    function isSetextHeading(token: TokenLike): token is SetextHeading {
        return token === equalsSetextHeadingToken
            || token === minusSetextHeadingToken;
    }

    function rescanAtxHeadingToken(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#atx-heading
        if (scanner.token() !== Token.HashToken) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);

        // only # through ###### is permitted as an ATX heading marker.
        const count: number | undefined = preprocessor.peekMaxCount(0, 6, CharacterCodes.hash);
        if (count === undefined) {
            return undefined;
        }

        // Must be followed by SPACE, TAB, or LINE ENDING
        if (!preprocessor.peekIsAny(count,
            CharacterCodes.space,
            CharacterCodes.tab,
            CharacterCodes.lineFeed,
            undefined /*EOF*/)
        ) {
            return undefined;
        }

        preprocessor.advance(count);
        return scanner.setToken(atxHeadingToken);
    }

    function rescanSetextHeadingToken(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#setext-heading-underline
        let char: number;
        let token: TokenLike;
        switch (scanner.token()) {
            case Token.EqualsToken:
                char = CharacterCodes.equals;
                token = equalsSetextHeadingToken;
                break;
            case Token.MinusToken:
                char = CharacterCodes.minus;
                token = minusSetextHeadingToken;
                break;
            default:
                return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        const markerCount: number = preprocessor.peekCount(0, char);
        const spaceCount: number = preprocessor.peekCount(markerCount, UnicodeUtils.isSpaceOrTab);
        if (!preprocessor.peekIsAny(markerCount + spaceCount,
            CharacterCodes.lineFeed,
            undefined /*EOF*/)
        ) {
            return undefined;
        }

        preprocessor.advance(markerCount);
        return scanner.setToken(token);
    }

    interface IHeadingState {
        content: ContentWriter;
    }

    function createHeadingState(): IHeadingState {
        return { content: new ContentWriter() };
    }

    function getState(parser: BlockParser, node: MarkdownHeading): IHeadingState {
        return parser.getState(MarkdownHeadingSyntax, node, createHeadingState);
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
        const scanner: Scanner = parser.scanner;
        if (parser.indented) {
            return undefined;
        }

        // https://spec.commonmark.org/0.29/#atx-headings
        //
        // - An ATX heading consists of [...] an opening sequence of 1–6 unescaped `#` characters [...].
        // - The opening sequence of `#` characters must be followed by a space or by the end of line.
        // - The opening `#` character may be indented 0-3 spaces.
        // - The heading level is equal to the number of `#` characters in the opening sequence.

        if (scanner.rescan(rescanAtxHeadingToken) === atxHeadingToken) {
            let pos: number = scanner.startPos;
            const level: number = scanner.tokenLength;
            scanner.scan();
            scanner.scanWhitespace();
            const block: MarkdownHeading = new MarkdownHeading({ pos, style: 'atx', level });
            const { content } = getState(parser, block);
            const startPos: number = scanner.startPos;
            const text: string = scanner.scanLine();
            content.addMapping(startPos);
            // NOTE: we don't need to add other mappings as we are only removing #s and spaces from the end of the string.
            content.write(text.replace(/^[ \t]*#+[ \t]*$/, '').replace(/[ \t]+#+[ \t]*$/, ''));
            parser.pushBlock(container, block);
            return block;
        }

        // https://spec.commonmark.org/0.29/#setext-headings

        if (container.kind !== SyntaxKind.MarkdownParagraph) {
            return undefined;
        }

        const para: MarkdownParagraph = container as MarkdownParagraph;
        const setextHeadingToken: TokenLike = scanner.rescan(rescanSetextHeadingToken);
        if (isSetextHeading(setextHeadingToken)) {
            const heading: MarkdownHeading = new MarkdownHeading({
                pos: container.pos,
                end: container.end,
                style: 'setext',
                level: setextHeadingToken === equalsSetextHeadingToken ? 1 : 2,
            });
            const { content } = getState(parser, heading);
            MarkdownParagraphSyntax.parseReferences(parser, para, content);
            if (content.length > 0) {
                container.insertSiblingAfter(heading);
                container.removeNode();
                scanner.scanLine();
                return heading;
            }
        }

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
    export function tryContinueBlock(parser: BlockParser, block: MarkdownHeading): boolean {
        // headings cannot match more than one line.
        return false;
    }

    /**
     * Finishes the current block, performing any necessary block-level post-processing.
     * @param parser The parser used to parse the Block.
     * @param block The Block to finish.
     */
    export function finishBlock(parser: BlockParser, block: MarkdownHeading): void {
        // Documents have no finish behavior.
    }

    /**
     * Gets the ContentWriter for the provided Block, if one exists.
     * @param parser The parser used to parse the Block.
     * @param block The Block from which to acquire a ContentWriter.
     * @returns The ContentWriter for the Block, if it exists; otherwise, `undefined`.
     */
    export function getContent(parser: BlockParser, block: MarkdownHeading): ContentWriter | undefined {
        return getState(parser, block).content;
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: MarkdownHeading): void {
        const tagname: string = `h${node.level}`;
        writer.writeLine();
        writer.writeTag(tagname);
        writer.writeContents(node);
        writer.writeTag(`/${tagname}`);
        writer.writeLine();
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownHeading): void {
        if (node.style === 'atx') {
            writer.write(StringUtils.repeat('#', node.level));
            writer.write(' ');
            writer.writeContents(node);
        } else {
            writer.writeContents(node);
            writer.write(node.level === 1 ? '===' : '---');
        }
        writer.writeln();
    }
}
