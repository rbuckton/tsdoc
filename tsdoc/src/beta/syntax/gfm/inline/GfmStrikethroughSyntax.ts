import { InlineParser, IDelimiterFrame } from "../../../parser/InlineParser";
import { Token, TokenLike } from "../../../parser/Token";
import { Preprocessor } from "../../../parser/Preprocessor";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { Scanner } from "../../../parser/Scanner";
import { Run } from "../../../nodes/Run";
import { Content } from "../../../nodes/Content";
import { GfmStrikethroughSpan } from "../../../nodes/GfmStrikethroughSpan";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IInlineSyntax } from "../../IInlineSyntax";
import { IDelimiterProcessor } from "../../IDelimiterProcessor";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";

export namespace GfmStrikethroughSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IInlineSyntax
        & IDelimiterProcessor
        & IHtmlEmittable<GfmStrikethroughSpan>
        & ITSDocEmittable<GfmStrikethroughSpan>
    >(GfmStrikethroughSyntax);

    // Special token for strikethrough
    const tildeTildeToken = Symbol("TildeTildeToken"); // ~~

    function rescanDelimiterToken(scanner: Scanner): TokenLike | undefined {
        // https://github.github.com/gfm/#strikethrough-extension-
        if (scanner.token() !== Token.TildeToken) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        if (!preprocessor.peekIs(0, CharacterCodes.tilde)) {
            return undefined;
        }

        preprocessor.advance(1);
        return scanner.setToken(tildeTildeToken);
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
    export function tryParseInline(parser: InlineParser): Run | undefined {
        // https://spec.commonmark.org/0.29/#emphasis-and-strong-emphasis
        const scanner: Scanner = parser.scanner;
        const preprocessor: Preprocessor = scanner.preprocessor;
        const token: TokenLike = scanner.rescan(rescanDelimiterToken);
        if (token !== tildeTildeToken) {
            return undefined;
        }

        const leadChar: number = preprocessor.peekAt(scanner.startPos - 1) || CharacterCodes.lineFeed;
        const leadIsWhitespace: boolean = UnicodeUtils.isUnicodeWhitespace(leadChar);
        const leadIsPunctuation: boolean = UnicodeUtils.isUnicodePunctuation(leadChar);
        const trailChar: number = preprocessor.peek(0) || CharacterCodes.lineFeed;
        const trailIsWhitespace: boolean = UnicodeUtils.isUnicodeWhitespace(trailChar);
        const trailIsPunctuation: boolean = UnicodeUtils.isUnicodePunctuation(trailChar);
        const leftFlank: boolean = !trailIsWhitespace && (!trailIsPunctuation || leadIsWhitespace || leadIsPunctuation);
        const rightFlank: boolean = !leadIsWhitespace && (!leadIsPunctuation || trailIsWhitespace || trailIsPunctuation);
        const canOpen: boolean = leftFlank;
        const canClose: boolean = rightFlank;
        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        const text: string = scanner.getTokenText();
        const delimiterCount: number = scanner.tokenLength;
        scanner.scan();

        const node: Run = new Run({ pos, end, text });
        if (canOpen || canClose) {
            parser.pushDelimiter(GfmStrikethroughSyntax, node, token, delimiterCount, canOpen, canClose);
        }
        return node;
    }

    /**
     * Process a balanced pair of delimiters.
     * @param parser The parser used to parse the delimited Inline.
     * @param opener The opening frame for the delimiter.
     * @param closer The closing frame for the delimiter.
     * @returns The string `"not-processed"` if the delimiter could not be processed; otherwise, the new
     * closing frame (or `undefined`) if a delimiter was processed.
     */
    export function processDelimiter(parser: InlineParser, opener: IDelimiterFrame | undefined, closer: IDelimiterFrame): IDelimiterFrame | "not-processed" | undefined {
        // https://spec.commonmark.org/0.29/#emphasis-and-strong-emphasis
        // https://spec.commonmark.org/0.29/#phase-2-inline-structure
        // https://github.github.com/gfm/#strikethrough-extension-
        if (!opener) {
            return closer.next;
        }

        if (closer.token !== tildeTildeToken || closer.remaining < 2 || opener.remaining < 2) {
            return "not-processed";
        }

        // calculate actual number of delimiters used from closer
        const delimiterCount: number = 2;
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
        const node: GfmStrikethroughSpan = new GfmStrikethroughSpan({ pos, end });

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

        // remove elements between opener and closer in delimiter stack
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
    export function emitHtml(writer: HtmlWriter, node: GfmStrikethroughSpan): void {
        writer.writeTag('del');
        writer.writeContents(node);
        writer.writeTag('/del');
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: GfmStrikethroughSpan): void {
        writer.write('~~');
        writer.writeContents(node);
        writer.write('~~');
    }
}
