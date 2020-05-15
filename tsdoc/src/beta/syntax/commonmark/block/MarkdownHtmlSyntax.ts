import { BlockParser } from "../../../parser/BlockParser";
import { SyntaxKind } from "../../../nodes/SyntaxKind";
import { Token, TokenLike } from "../../../parser/Token";
import { Scanner } from "../../../parser/Scanner";
import { HtmlUtils } from "../../../utils/HtmlUtils";
import { ContentWriter } from "../../../parser/ContentWriter";
import { MarkdownHtmlBlock } from "../../../nodes/MarkdownHtmlBlock";
import { Block } from "../../../nodes/Block";
import { MarkdownHtmlInline } from "../../../nodes/MarkdownHtmlInline";
import { InlineParser } from "../../../parser/InlineParser";
import { Preprocessor } from "../../../parser/Preprocessor";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IBlockSyntax } from "../../IBlockSyntax";
import { IInlineSyntax } from "../../IInlineSyntax";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";

export namespace MarkdownHtmlSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IBlockSyntax<MarkdownHtmlBlock>
        & IInlineSyntax
        & IHtmlEmittable<MarkdownHtmlBlock | MarkdownHtmlInline>
        & ITSDocEmittable<MarkdownHtmlBlock | MarkdownHtmlInline>
        >(MarkdownHtmlSyntax);

    // Special tokens for HTML
    const htmlProcessingInstructionStartToken = Symbol("HtmlProcessingInstructionStartToken");  // <?
    const htmlProcessingInstructionEndToken = Symbol("HtmlProcessingInstructionEndToken");      // ?>
    const htmlEndTagStartToken = Symbol("HtmlEndTagStartToken");                                // </
    const htmlSelfClosingTagEndToken = Symbol("HtmlSelfClosingTagEndToken");                    // />
    const htmlDeclarationStartToken = Symbol("HtmlDeclarationStartToken");                      // <!
    const htmlCharacterDataStartToken = Symbol("HtmlCharacterDataStartToken");                  // <![CDATA[
    const htmlCharacterDataEndToken = Symbol("HtmlCharacterDataEndToken");                      // ]]>
    const htmlCommentStartToken = Symbol("HtmlCommentStartToken");                              // <!--
    const htmlCommentEndToken = Symbol("HtmlCommentEndToken");                                  // -->
    const htmlCommentMinusMinusToken = Symbol("HtmlCommentMinusMinusToken");                    // --
    const htmlTagName = Symbol("HtmlTagName");                                                  // a, html, etc.
    const htmlAttributeName = Symbol("HtmlAttributeName");                                      // src, href, etc.
    const htmlSingleQuotedAttributeValue = Symbol("HtmlSingleQuotedAttributeValue");            // 'abc'
    const htmlDoubleQuotedAttributeValue = Symbol("HtmlDoubleQuotedAttributeValue");            // "abc"
    const htmlUnquotedAttributeValue = Symbol("HtmlUnquotedAttributeValue");                    // abc

    type HtmlAttributeValue =
        | typeof htmlSingleQuotedAttributeValue
        | typeof htmlDoubleQuotedAttributeValue
        | typeof htmlUnquotedAttributeValue
        ;

    function isHtmlAttributeValue(token: TokenLike): token is HtmlAttributeValue {
        return token === htmlSingleQuotedAttributeValue
            || token === htmlDoubleQuotedAttributeValue
            || token === htmlUnquotedAttributeValue;
    }

    function rescanHtmlStartToken(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#open-tag
        // https://spec.commonmark.org/0.29/#processing-instruction
        // https://spec.commonmark.org/0.29/#html-comment
        // https://spec.commonmark.org/0.29/#declaration
        // https://spec.commonmark.org/0.29/#cdata-section
        // https://spec.commonmark.org/0.29/#closing-tag
        const preprocessor: Preprocessor = scanner.preprocessor;
        if (scanner.token() === Token.LessThanToken) {
            // https://spec.commonmark.org/0.29/#processing-instruction
            // <?
            if (preprocessor.peekIs(0, CharacterCodes.question)) {
                preprocessor.advance(1);
                return scanner.setToken(htmlProcessingInstructionStartToken);
            }
            // https://spec.commonmark.org/0.29/#html-comment
            // <!--
            if (preprocessor.peekIsSequence(0,
                CharacterCodes.exclamation,
                CharacterCodes.minus,
                CharacterCodes.minus)) {
                preprocessor.advance(3);
                // NOTE: '<!-->' and '<!--->' are not valid comments.
                if (preprocessor.peekIs(0, CharacterCodes.greaterThan) ||
                    preprocessor.peekIsSequence(0, CharacterCodes.minus, CharacterCodes.greaterThan)) {
                    return undefined;
                }
                return scanner.setToken(htmlCommentStartToken);
            }
            // https://spec.commonmark.org/0.29/#declaration
            // <! (followed by A-Z)
            if (preprocessor.peekIsSequence(0,
                CharacterCodes.exclamation,
                UnicodeUtils.isAsciiUpperCaseLetter)) {
                preprocessor.advance(1); // do not include the alpha character.
                return scanner.setToken(htmlDeclarationStartToken);
            }
            // https://spec.commonmark.org/0.29/#cdata-section
            // <![CDATA[
            if (preprocessor.peekIsSequence(0,
                CharacterCodes.exclamation,
                CharacterCodes.openBracket,
                CharacterCodes.C,
                CharacterCodes.D,
                CharacterCodes.A,
                CharacterCodes.T,
                CharacterCodes.A,
                CharacterCodes.openBracket)) {
                preprocessor.advance(8);
                return scanner.setToken(htmlCharacterDataStartToken);
            }
            // https://spec.commonmark.org/0.29/#closing-tag
            // </
            if (preprocessor.peekIs(0, CharacterCodes.slash)) {
                preprocessor.advance(1);
                return scanner.setToken(htmlEndTagStartToken);
            }
        }
        return undefined;
    }

    function rescanHtmlEndToken(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#open-tag
        // https://spec.commonmark.org/0.29/#processing-instruction
        // https://spec.commonmark.org/0.29/#html-comment
        // https://spec.commonmark.org/0.29/#declaration
        // https://spec.commonmark.org/0.29/#cdata-section
        // https://spec.commonmark.org/0.29/#closing-tag
        const preprocessor: Preprocessor = scanner.preprocessor;
        switch (scanner.token()) {
            case Token.QuestionToken:
                // https://spec.commonmark.org/0.29/#processing-instruction
                // ?>
                if (preprocessor.peekIs(0, CharacterCodes.greaterThan)) {
                    preprocessor.advance(1);
                    return scanner.setToken(htmlProcessingInstructionEndToken);
                }
                return;
            case Token.MinusToken:
                // https://spec.commonmark.org/0.29/#html-comment
                // -->
                if (preprocessor.peekIsSequence(0,
                    CharacterCodes.minus,
                    CharacterCodes.greaterThan)) {
                    preprocessor.advance(2);
                    return scanner.setToken(htmlCommentEndToken);
                }
                // NOTE: '--' is invalid in a comment
                if (preprocessor.peekIs(0, CharacterCodes.minus)) {
                    preprocessor.advance(1);
                    return scanner.setToken(htmlCommentMinusMinusToken);
                }
                break;
            case Token.CloseBracketToken:
                // https://spec.commonmark.org/0.29/#cdata-section
                // ]]>
                if (preprocessor.peekIsSequence(0,
                    CharacterCodes.closeBracket,
                    CharacterCodes.greaterThan)) {
                    preprocessor.advance(2);
                    return scanner.setToken(htmlCharacterDataEndToken);
                }
                break;
            case Token.SlashToken:
                // https://spec.commonmark.org/0.29/#open-tag
                // />
                if (preprocessor.peekIs(0, CharacterCodes.greaterThan)) {
                    preprocessor.advance(1);
                    return scanner.setToken(htmlSelfClosingTagEndToken);
                }
                break;
        }
        return undefined;
    }

    function isHtmlTagNameStart(codePoint: number | undefined): boolean {
        // https://spec.commonmark.org/0.29/#tag-name
        return UnicodeUtils.isAsciiLetter(codePoint);
    }

    function isHtmlTagNamePart(codePoint: number | undefined): boolean {
        // https://spec.commonmark.org/0.29/#tag-name
        return isHtmlTagNameStart(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint)
            || codePoint === CharacterCodes.minus;
    }

    /**
     * Rescans the current token to reinterpret it as an HTML tag name.
     */
    function rescanHtmlTagName(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#tag-name
        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);
        const count: number = preprocessor.peekCount(0, isHtmlTagNameStart, isHtmlTagNamePart);
        if (count > 0) {
            preprocessor.advance(count);
            return scanner.setToken(htmlTagName);
        }
        return undefined;
    }

    function isHtmlAttributeNameStart(codePoint: number | undefined): boolean {
        return UnicodeUtils.isAsciiLetter(codePoint)
            || codePoint === CharacterCodes._
            || codePoint === CharacterCodes.colon;
    }

    function isHtmlAttributeNamePart(codePoint: number | undefined): boolean {
        return isHtmlAttributeNameStart(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint)
            || codePoint === CharacterCodes.dot
            || codePoint === CharacterCodes.minus;
    }

    function rescanHtmlAttributeName(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#attribute-name
        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);
        const count: number = preprocessor.peekCount(0, isHtmlAttributeNameStart, isHtmlAttributeNamePart);
        if (count > 0) {
            preprocessor.advance(count);
            return scanner.setToken(htmlAttributeName);
        }
        return undefined;
    }

    function isHtmlAttributeValuePart(codePoint: number | undefined): boolean {
        return !UnicodeUtils.isAsciiWhitespace(codePoint)
            && codePoint !== CharacterCodes.quoteMark
            && codePoint !== CharacterCodes.apostrophe
            && codePoint !== CharacterCodes.equals
            && codePoint !== CharacterCodes.lessThan
            && codePoint !== CharacterCodes.greaterThan
            && codePoint !== CharacterCodes.backtick
            && codePoint !== undefined;
    }

    function rescanHtmlAttributeValue(scanner: Scanner, singleLine: boolean): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#single-quoted-attribute-value
        // https://spec.commonmark.org/0.29/#double-quoted-attribute-value
        // https://spec.commonmark.org/0.29/#unquoted-attribute-value
        const preprocessor: Preprocessor = scanner.preprocessor;
        let quoteChar: number;
        let token: TokenLike;
        switch (scanner.token()) {
            case Token.QuoteMarkToken:
                quoteChar = CharacterCodes.quoteMark;
                token = htmlDoubleQuotedAttributeValue;
                break;
            case Token.ApostropheToken:
                quoteChar = CharacterCodes.apostrophe;
                token = htmlSingleQuotedAttributeValue;
                break;
            default:
                preprocessor.setPos(scanner.startPos);
                const count: number = preprocessor.peekCount(0, isHtmlAttributeValuePart);
                if (count > 0) {
                    preprocessor.advance(count);
                    return scanner.setToken(htmlUnquotedAttributeValue);
                }
                return undefined;
        }

        const pos: number = scanner.pos;
        const count: number = singleLine ?
            preprocessor.peekCountUntilAny(0, quoteChar, CharacterCodes.lineFeed) :
            preprocessor.peekCountUntilAny(0, quoteChar);
        if (preprocessor.peekIs(count, quoteChar)) {
            preprocessor.advance(count);
            const tokenValue: string = scanner.slice(pos, scanner.pos);
            preprocessor.read();
            return scanner.setToken(token, tokenValue);
        }
        return undefined;
    }

    enum MarkdownHtmlBlockType {
        ScriptOrPreOrStyle,
        Comment,
        ProcessingInstruction,
        Declaration,
        CharacterData,
        BlockTag,
        StandaloneTag,
    }

    interface IHtmlBlockState {
        content: ContentWriter;
        htmlBlockType?: MarkdownHtmlBlockType;
    }

    function createHtmlBlockState(): IHtmlBlockState {
        return {
            content: new ContentWriter()
        };
    }

    function getState(parser: BlockParser, node: MarkdownHtmlBlock): IHtmlBlockState {
        return parser.getState(MarkdownHtmlSyntax, node, createHtmlBlockState);
    }

    function startHtmlBlock(parser: BlockParser, container: Block, blockType: MarkdownHtmlBlockType): Block {
        parser.retreatToIndentStart();
        const pos: number = parser.scanner.startPos;
        const node: MarkdownHtmlBlock = new MarkdownHtmlBlock({ pos });
        getState(parser, node).htmlBlockType = blockType;
        parser.pushBlock(container, node);
        return node;
    }

    const htmlBlockCloseRegExps: RegExp[] = [
        /<\/(?:script|pre|style)>/i,
        /-->/,
        /\?>/,
        />/,
        /\]\]>/
    ];

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
        // https://spec.commonmark.org/0.29/#html-blocks
        const scanner: Scanner = parser.scanner;
        if (!parser.indented && scanner.token() === Token.LessThanToken) {
            const token: TokenLike = scanner.rescan(rescanHtmlStartToken);
            switch (token) {
                case htmlCommentStartToken:
                    // case 2: `<!--`
                    return startHtmlBlock(parser, container, MarkdownHtmlBlockType.Comment);
                case htmlProcessingInstructionStartToken:
                    // case 3: `<?`
                    return startHtmlBlock(parser, container, MarkdownHtmlBlockType.ProcessingInstruction);
                case htmlDeclarationStartToken:
                    // case 4: `<!` followed by [A-Z]
                    return startHtmlBlock(parser, container, MarkdownHtmlBlockType.Declaration);
                case htmlCharacterDataStartToken:
                    // case 5: `<![CDATA[`
                    return startHtmlBlock(parser, container, MarkdownHtmlBlockType.CharacterData);
                case htmlEndTagStartToken:
                case Token.LessThanToken: {
                    // case 1: `<script`, `<pre`, or `<style` followed by whitespace, `>` or `\n`.
                    // case 6: `<` or `</` followed by address, article, ...
                    // case 7: any stand-alone full html tag on a single line.
                    scanner.scan();
                    if (scanner.rescan(rescanHtmlTagName) === htmlTagName) {
                        const tagName: string = scanner.getTokenText().toLowerCase();
                        scanner.scan();
                        // case 1: `<script`, `<pre`, or `<style` followed by whitespace, `>`, or `\n`.
                        if (token === Token.LessThanToken &&
                            (tagName === "script" || tagName === "pre" || tagName === "style") &&
                            (Token.isWhitespaceCharacter(scanner.token()) || scanner.token() === Token.GreaterThanToken || Token.isLineEnding(scanner.token()))) {
                            return startHtmlBlock(parser, container, MarkdownHtmlBlockType.ScriptOrPreOrStyle);
                        }
                        // case 6: `<` or `</`, followed by a known block tag, followed by whitespace, `>`, `/>`, or `\n`
                        if (HtmlUtils.isKnownHtmlBlockTag(tagName)) {
                            scanner.rescan(rescanHtmlEndToken);
                            if (Token.isWhitespaceCharacter(scanner.token()) ||
                                Token.isLineEnding(scanner.token()) ||
                                scanner.token() === Token.GreaterThanToken ||
                                scanner.token() === htmlSelfClosingTagEndToken) {
                                return startHtmlBlock(parser, container, MarkdownHtmlBlockType.BlockTag);
                            }
                        }
                        // case 7: any stand-alone full html tag on a single line.
                        if (container.kind !== SyntaxKind.MarkdownParagraph &&
                            (token === htmlEndTagStartToken || tagName !== "script" && tagName !== "pre" && tagName !== "style")) {
                            // scan past attributes
                            let hasWhitespaceSeperator: boolean = scanner.scanWhitespace();
                            let hasInvalidAttributes: boolean = false;
                            if (token === Token.LessThanToken) {
                                while (hasWhitespaceSeperator) {
                                    if (scanner.rescan(rescanHtmlAttributeName) !== htmlAttributeName) {
                                        break;
                                    }
                                    scanner.scan();
                                    hasWhitespaceSeperator = scanner.scanWhitespace();
                                    if (scanner.token() === Token.EqualsToken) {
                                        scanner.scan();
                                        scanner.scanWhitespace();
                                        if (!isHtmlAttributeValue(scanner.rescan(rescanHtmlAttributeValue, /*singleLine*/ true))) {
                                            hasInvalidAttributes = true;
                                            break;
                                        }
                                        scanner.scan();
                                        hasWhitespaceSeperator = scanner.scanWhitespace();
                                    }
                                }
                            }
                            if (!hasInvalidAttributes) {
                                scanner.rescan(rescanHtmlEndToken);
                                if (scanner.token() === Token.GreaterThanToken ||
                                    scanner.token() === htmlSelfClosingTagEndToken) {
                                    scanner.scan();
                                    scanner.scanWhitespace();
                                    if (Token.isLineEnding(scanner.token())) {
                                        return startHtmlBlock(parser, container, MarkdownHtmlBlockType.StandaloneTag);
                                    }
                                }
                            }
                        }
                    }
                    break;
                }
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
    export function tryContinueBlock(parser: BlockParser, block: MarkdownHtmlBlock): boolean {
        const { htmlBlockType } = getState(parser, block);
        return !(parser.blank && (
            htmlBlockType === MarkdownHtmlBlockType.BlockTag ||
            htmlBlockType === MarkdownHtmlBlockType.StandaloneTag));
    }

    /**
     * Finishes the current block, performing any necessary block-level post-processing.
     * @param parser The parser used to parse the Block.
     * @param block The Block to finish.
     */
    export function finishBlock(parser: BlockParser, block: MarkdownHtmlBlock): void {
        const state: IHtmlBlockState = getState(parser, block);
        block.literal = state.content.toString().replace(/(\n *)+$/, '');
    }

    /**
     * Accepts the remaining source text of the current line as a content line of the Block.
     * @param parser The parser used to parse the Block.
     * @param block The Block accepting the line.
     * @returns The Block the parser will set as the current Block. This is usually the input Block
     * however some parsers can change the current block if accepting the line finishes the block.
     */
    export function acceptLine(parser: BlockParser, block: MarkdownHtmlBlock): Block {
        parser.retreatToIndentStart();

        const { content, htmlBlockType } = getState(parser, block);
        const scanner: Scanner = parser.scanner;
        const line: string = scanner.scanLine();
        content.addMapping(scanner.startPos);
        content.write(line);
        if (scanner.token() === Token.NewLineTrivia) {
            content.write("\n");
        }

        if (htmlBlockType !== undefined &&
            htmlBlockType >= MarkdownHtmlBlockType.ScriptOrPreOrStyle &&
            htmlBlockType <= MarkdownHtmlBlockType.CharacterData &&
            htmlBlockCloseRegExps[htmlBlockType].test(line)) {
            const parent: Block | undefined = parser.finish(block);
            block.end = scanner.startPos;
            if (!parent) throw new Error('Expected block to have a parent.');
            return parent;
        }
        return block;
    }

    /**
     * Gets the ContentWriter for the provided Block, if one exists.
     * @param parser The parser used to parse the Block.
     * @param block The Block from which to acquire a ContentWriter.
     * @returns The ContentWriter for the Block, if it exists; otherwise, `undefined`.
     */
    export function tryParseInline(parser: InlineParser): MarkdownHtmlInline | undefined {
        // https://spec.commonmark.org/0.29/#raw-html
        const scanner: Scanner = parser.scanner;
        if (scanner.token() !== Token.LessThanToken) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const token: TokenLike = scanner.rescan(rescanHtmlStartToken);
        switch (token) {
            case htmlCommentStartToken:
                // <!-- ... -->
                while (scanner.rescan(rescanHtmlEndToken) !== htmlCommentEndToken) {
                    if (scanner.token() === Token.EndOfFileToken ||
                        scanner.token() === htmlCommentMinusMinusToken) {
                        return undefined;
                    }
                    scanner.scan();
                }
                scanner.scan();
                break;
            case htmlProcessingInstructionStartToken:
                // <? ... ?>
                while (scanner.rescan(rescanHtmlEndToken) !== htmlProcessingInstructionEndToken) {
                    if (scanner.token() === Token.EndOfFileToken) {
                        return undefined;
                    }
                    scanner.scan();
                }
                scanner.scan();
                break;
            case htmlDeclarationStartToken:
                // <! ... >
                while (scanner.token() !== Token.GreaterThanToken) {
                    if (scanner.token() === Token.EndOfFileToken) {
                        return undefined;
                    }
                    scanner.scan();
                }
                scanner.scan();
                break;
            case htmlCharacterDataStartToken:
                // <![CDATA[ ... ]]>
                while (scanner.rescan(rescanHtmlEndToken) !== htmlCharacterDataEndToken) {
                    if (scanner.token() === Token.EndOfFileToken) {
                        return undefined;
                    }
                    scanner.scan();
                }
                scanner.scan();
                break;

            case htmlEndTagStartToken:
            case Token.LessThanToken:
                // </ ... >
                // < ... >
                scanner.scan();
                if (scanner.rescan(rescanHtmlTagName) !== htmlTagName) {
                    return undefined;
                }

                scanner.scan();

                // scan past attributes
                let hasWhitespaceSeperator: boolean = scanner.scanWhitespaceAndNewLines();
                if (token === Token.LessThanToken) {
                    while (hasWhitespaceSeperator) {
                        if (scanner.rescan(rescanHtmlAttributeName) !== htmlAttributeName) {
                            break;
                        }
                        scanner.scan();
                        hasWhitespaceSeperator = scanner.scanWhitespaceAndNewLines();
                        if (scanner.token() === Token.EqualsToken) {
                            scanner.scan();
                            scanner.scanWhitespaceAndNewLines();
                            if (!isHtmlAttributeValue(scanner.rescan(rescanHtmlAttributeValue, /*singleLine*/ false))) {
                                return undefined;
                            }
                            scanner.scan();
                            hasWhitespaceSeperator = scanner.scanWhitespaceAndNewLines();
                        }
                    }
                }
                scanner.rescan(rescanHtmlEndToken);
                if (scanner.token() !== Token.GreaterThanToken &&
                    scanner.token() !== htmlSelfClosingTagEndToken) {
                    return undefined;
                }
                scanner.scan();
                break;
        }
        const end: number = scanner.startPos;
        const html: string = scanner.slice(pos, end);
        return new MarkdownHtmlInline({ pos, end, html });
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: MarkdownHtmlBlock | MarkdownHtmlInline): void {
        if (node.kind === SyntaxKind.MarkdownHtmlBlock) {
            writer.writeLine();
            writer.writeHtml(node.literal);
            writer.writeLine();
        } else {
            writer.writeHtml(node.literal);
        }
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownHtmlBlock | MarkdownHtmlInline): void {
        writer.write(node.literal);
        if (node.kind === SyntaxKind.MarkdownHtmlBlock) {
            writer.writeLine();
        }
    }
}
