import { InlineParser, IDelimiterFrame } from "../../../parser/InlineParser";
import { Token, TokenLike } from "../../../parser/Token";
import { Preprocessor } from "../../../parser/Preprocessor";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { Scanner } from "../../../parser/Scanner";
import { MarkdownStrongSpan } from "../../../nodes/MarkdownStrongSpan";
import { MarkdownEmSpan } from "../../../nodes/MarkdownEmSpan";
import { Run } from "../../../nodes/Run";
import { Content } from "../../../nodes/Content";
import { Inline } from "../../../nodes/Inline";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IInlineSyntax } from "../../IInlineSyntax";
import { IDelimiterProcessor } from "../../IDelimiterProcessor";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { SyntaxKind } from "../../../nodes/SyntaxKind";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";
import { StringUtils } from "../../../utils/StringUtils";

export namespace MarkdownEmphasisSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IInlineSyntax
        & IDelimiterProcessor
        & IHtmlEmittable<MarkdownEmSpan | MarkdownStrongSpan>
        & ITSDocEmittable<MarkdownEmSpan | MarkdownStrongSpan>
    >(MarkdownEmphasisSyntax);

    // Special tokens for Emphasis
    const asteriskEmphasisToken = Symbol('AsteriskEmphasisToken');      // * or ** or ***
    const underscoreEmphasisToken = Symbol('UnderscoreEmphasisToken');  // _ or __ or ___

    type EmphasisToken =
        | typeof asteriskEmphasisToken
        | typeof underscoreEmphasisToken
        ;

    function isEmphasisToken(token: TokenLike): token is EmphasisToken {
        return token === asteriskEmphasisToken
            || token === underscoreEmphasisToken;
    }

    function rescanDelimiterToken(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#delimiter-run
        let char: number;
        let token: TokenLike;
        switch (scanner.token()) {
            case Token.AsteriskToken:
                char = CharacterCodes.asterisk;
                token = asteriskEmphasisToken;
                break;
            case Token.UnderscoreToken:
                char = CharacterCodes._;
                token = underscoreEmphasisToken;
                break;
            default:
                return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        const count: number = preprocessor.peekCount(0, char);
        preprocessor.advance(count);
        return scanner.setToken(token);
    }

    /**
     * Attempts to parse an Inline from the current token.
     *
     * NOTE: This function should be executed inside of a call to BlockParser.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param parser The parser used to parse the Inline.
     * @param container The container for the Inline.
     */
    export function tryParseInline(parser: InlineParser): Inline | undefined {
        // https://spec.commonmark.org/0.29/#emphasis-and-strong-emphasis
        const scanner: Scanner = parser.scanner;
        const token: TokenLike = scanner.rescan(rescanDelimiterToken);
        if (!isEmphasisToken(token)) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        const leadChar: number = preprocessor.peekAt(scanner.startPos - 1) || CharacterCodes.lineFeed;
        const leadIsWhitespace: boolean = UnicodeUtils.isUnicodeWhitespace(leadChar);
        const leadIsPunctuation: boolean = UnicodeUtils.isUnicodePunctuation(leadChar);
        const trailChar: number = preprocessor.peekAt(scanner.pos) || CharacterCodes.lineFeed;
        const trailIsWhitespace: boolean = UnicodeUtils.isUnicodeWhitespace(trailChar);
        const trailIsPunctuation: boolean = UnicodeUtils.isUnicodePunctuation(trailChar);
        const leftFlank: boolean = !trailIsWhitespace && (!trailIsPunctuation || leadIsWhitespace || leadIsPunctuation);
        const rightFlank: boolean = !leadIsWhitespace && (!leadIsPunctuation || trailIsWhitespace || trailIsPunctuation);
        const isUnderscore: boolean = token === underscoreEmphasisToken;
        const canOpen: boolean = leftFlank && (!isUnderscore || !rightFlank || leadIsPunctuation);
        const canClose: boolean = rightFlank && (!isUnderscore || !leftFlank || trailIsPunctuation);
        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        const text: string = scanner.getTokenText();
        const delimiterCount: number = scanner.tokenLength;
        scanner.scan();

        const node: Run = new Run({ pos, end, text });
        if (canOpen || canClose) {
            parser.pushDelimiter(MarkdownEmphasisSyntax, node, token, delimiterCount, canOpen, canClose);
        }
        return node;
    }

    export function processDelimiter(parser: InlineParser, opener: IDelimiterFrame | undefined, closer: IDelimiterFrame): IDelimiterFrame | "not-processed" | undefined {
        // https://spec.commonmark.org/0.29/#emphasis-and-strong-emphasis
        // https://spec.commonmark.org/0.29/#phase-2-inline-structure
        if (!opener) {
            return closer.next;
        }

        if (!isEmphasisToken(closer.token)) {
            return "not-processed";
        }

        // calculate actual number of delimiters used from closer
        const delimiterCount: number = (closer.remaining >= 2 && opener.remaining >= 2) ? 2 : 1;
        const openerRun: Run = opener.node;
        const closerRun: Run = closer.node;

        // remove used delimiters from stack elts and inlines
        opener.remaining -= delimiterCount;
        openerRun.text = openerRun.text.slice(0, -delimiterCount);
        openerRun.end -= delimiterCount;

        closer.remaining -= delimiterCount;
        closerRun.text = closerRun.text.slice(0, -delimiterCount);
        closerRun.pos += delimiterCount;

        // build contents for new emph element
        const pos: number = openerRun.pos + opener.remaining;
        const end: number = closerRun.pos + closer.remaining;
        const node: MarkdownStrongSpan | MarkdownEmSpan = delimiterCount === 1 ?
            new MarkdownEmSpan({ pos, end, style: closer.token === asteriskEmphasisToken ? 'asterisk' : 'underscore' }) :
            new MarkdownStrongSpan({ pos, end, style: closer.token === asteriskEmphasisToken ? 'asterisk' : 'underscore' });

        // move everything between the open and closer into the inline
        let current: Content | undefined = openerRun.nextSibling;
        let next: Content | undefined;
        while (current && current !== closerRun) {
            next = current.nextSibling;
            current.removeNode();
            node.appendChild(current);
            current = next;
        }

        openerRun.insertSiblingAfter(node);

        // remove elts between opener and closer in delimiters stack
        parser.removeDelimitersBetween(opener, closer);

        // if opener has 0 delims, remove it and the inline
        if (opener.remaining === 0) {
            openerRun.removeNode();
            parser.removeDelimiter(opener);
        }

        if (closer.remaining === 0) {
            closerRun.removeNode();
            const nextFrame: IDelimiterFrame | undefined = closer.next;
            parser.removeDelimiter(closer);
            return nextFrame;
        }

        return closer;
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: MarkdownEmSpan | MarkdownStrongSpan): void {
        const tagName = node.kind === SyntaxKind.MarkdownEmSpan ? 'em' : 'strong';
        writer.writeTag(tagName);
        writer.writeContents(node);
        writer.writeTag('/' + tagName);
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownEmSpan | MarkdownStrongSpan): void {
        const delimiter: string = node.style === 'asterisk' ? '*' : '_';
        const delimiterRun: string = StringUtils.repeat(delimiter, node.kind === SyntaxKind.MarkdownEmSpan ? 1 : 2);
        writer.write(delimiterRun);
        writer.writeContents(node);
        writer.write(delimiterRun);
    }
}
