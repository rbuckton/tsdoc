import { InlineParser, IDelimiterFrame } from "../InlineParser";
import { Token } from "../Token";
import { Preprocessor } from "../Preprocessor";
import { CharacterCodes } from "../CharacterCodes";
import { UnicodeUtils } from "../utils/UnicodeUtils";
import { Scanner } from "../Scanner";
import { MarkdownDelimiterScanner } from "../scanners/MarkdownDelimiterScanner";
import { MarkdownStrongSpan } from "../../nodes/MarkdownStrongSpan";
import { MarkdownEmSpan } from "../../nodes/MarkdownEmSpan";
import { Run } from "../../nodes/Run";
import { Content } from "../../nodes/Content";

export namespace MarkdownDelimiterParser {
    export function tryParse(parser: InlineParser): Run | undefined {
        // https://spec.commonmark.org/0.29/#emphasis-and-strong-emphasis
        const scanner: Scanner = parser.scanner;
        const preprocessor: Preprocessor = scanner.preprocessor;
        const token: Token = scanner.rescan(MarkdownDelimiterScanner.rescanDelimiterToken);
        if (!Token.isEmphasisToken(token)) {
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
        const isUnderscore: boolean = token === Token.UnderscoreEmphasisToken;
        const canOpen: boolean = leftFlank && (!isUnderscore || !rightFlank || leadIsPunctuation);
        const canClose: boolean = rightFlank && (!isUnderscore || !leftFlank || trailIsPunctuation);
        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        const text: string = scanner.getTokenText();
        const delimiterCount: number = scanner.tokenLength;
        scanner.scan();
        
        const node: Run = new Run({ pos, end });
        parser.getParserState(node).text = text;
        if (canOpen || canClose) {
            parser.pushDelimiter(node, token, delimiterCount, canOpen, canClose);
        }
        return node;
    }

    export function processDelimiter(parser: InlineParser, opener: IDelimiterFrame | undefined, closer: IDelimiterFrame): IDelimiterFrame | "not-processed" | undefined {
        // https://spec.commonmark.org/0.29/#emphasis-and-strong-emphasis
        // https://spec.commonmark.org/0.29/#phase-2-inline-structure
        if (!opener) {
            return closer.next;
        }

        if (!Token.isEmphasisToken(closer.token)) {
            return "not-processed";
        }

        // calculate actual number of delimiters used from closer
        const delimiterCount: number = (closer.remaining >= 2 && opener.remaining >= 2) ? 2 : 1;
        const openerRun: Run = opener.node;
        const closerRun: Run = closer.node;

        // remove used delimiters from stack elts and inlines
        opener.remaining -= delimiterCount;
        parser.getParserState(openerRun).text = openerRun.text.slice(0, -delimiterCount);
        openerRun.end -= delimiterCount;
        
        closer.remaining -= delimiterCount;
        parser.getParserState(closerRun).text = closerRun.text.slice(0, -delimiterCount);
        closerRun.pos += delimiterCount;

        // build contents for new emph element
        const pos: number = openerRun.pos + opener.remaining;
        const end: number = closerRun.pos + closer.remaining;
        const node: MarkdownStrongSpan | MarkdownEmSpan = delimiterCount === 1 ?
            new MarkdownEmSpan({ pos, end, emphasisToken: closer.token }) :
            new MarkdownStrongSpan({ pos, end, emphasisToken: closer.token });

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
}
