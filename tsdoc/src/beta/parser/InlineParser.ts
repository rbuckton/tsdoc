import { Token, TokenLike } from "./Token";
import { IInlineSyntax } from "../syntax/IInlineSyntax";
import { MarkdownLineBreakSyntax } from "../syntax/commonmark/inline/MarkdownLineBreakSyntax";
import { MarkdownCodeSpanSyntax } from "../syntax/commonmark/inline/MarkdownCodeSpanSyntax";
import { MarkdownBackslashEscapeSyntax } from "../syntax/commonmark/inline/MarkdownBackslashEscapeSyntax";
import { MarkdownEmphasisSyntax } from "../syntax/commonmark/inline/MarkdownEmphasisSyntax";
import { MarkdownLinkSyntax } from "../syntax/commonmark/inline/MarkdownLinkSyntax";
import { MarkdownAutoLinkSyntax } from "../syntax/commonmark/inline/MarkdownAutoLinkSyntax";
import { MarkdownCharacterEntitySyntax } from "../syntax/commonmark/inline/MarkdownCharacterEntitySyntax";
import { Inline } from "../nodes/Inline";
import { Run } from "../nodes/Run";
import { MarkdownLinkReference } from "../nodes/MarkdownLinkReference";
import { IMapping } from "./Mapper";
import { MarkdownLinkReferenceSyntax } from "../syntax/commonmark/inline/MarkdownLinkReferenceSyntax";
import { ParserBase } from "./ParserBase";
import { Content } from "../nodes/Content";
import { Document } from "../nodes/Document";
import { MarkdownHardBreak } from "../nodes/MarkdownHardBreak";
import { MarkdownSoftBreak } from "../nodes/MarkdownSoftBreak";
import { GfmStrikethroughSyntax } from "../syntax/gfm/inline/GfmStrikethroughSyntax";
import { GfmAutoLinkSyntax } from "../syntax/gfm/inline/GfmAutoLinkSyntax";
import { MarkdownHtmlSyntax } from "../syntax/commonmark/block/MarkdownHtmlSyntax";
import { IDelimiterProcessor } from "../syntax/IDelimiterProcessor";
import { IInlineContainer } from "../nodes/mixins/InlineContainerMixin";

export interface IDelimiterFrame {
    prev?: IDelimiterFrame;
    next?: IDelimiterFrame;
    readonly node: Run;
    readonly token: TokenLike;
    readonly count: number;
    readonly canOpen: boolean;
    readonly canClose: boolean;
    remaining: number;
}

export interface IBracketFrame {
    prev?: IBracketFrame;
    hasBracketAfter?: boolean;
    delimiters?: IDelimiterFrame;
    readonly node: Run;
    readonly token: TokenLike;
    active: boolean;
}

export class InlineParser extends ParserBase {
    private _document: Document;
    private _delimiterTokens: Map<TokenLike, Set<IDelimiterProcessor>> = new Map();
    private _delimiters: IDelimiterFrame | undefined;
    private _brackets: IBracketFrame | undefined;
    private _inlineSyntaxParsers: IInlineSyntax[];

    public constructor(document: Document, text: string, sourceMappings: ReadonlyArray<IMapping> | undefined, gfm: boolean) {
        super(text.replace(/\s+$/, ''), sourceMappings);
        this._document = document;
        this._inlineSyntaxParsers = InlineParser.getDefaultInlineSyntaxParsers(gfm);
        this.scanner.scan();
    }

    public static getDefaultInlineSyntaxParsers(gfm: boolean): IInlineSyntax[] {
        return [
            MarkdownLineBreakSyntax,
            MarkdownBackslashEscapeSyntax,
            MarkdownCodeSpanSyntax,
            MarkdownEmphasisSyntax,
            ...(gfm ? [GfmStrikethroughSyntax] : []),
            MarkdownLinkSyntax,
            ...(gfm ? [GfmAutoLinkSyntax] : []),
            MarkdownAutoLinkSyntax,
            MarkdownHtmlSyntax,
            MarkdownCharacterEntitySyntax,
        ];
    }

    public get document(): Document {
        return this._document;
    }

    public parse(block: IInlineContainer & Content): void {
        let lastRun: Run | undefined;
        while (this.scanner.token() !== Token.EndOfFileToken) {
            const inline: Inline | undefined = this._parseInline(block);
            if (inline) {
                lastRun = undefined;
                block.appendChild(inline);
            } else {
                if (lastRun) {
                    lastRun.text += this.scanner.getTokenText();
                    lastRun.end = this.scanner.pos;
                } else {
                    lastRun = new Run({
                        pos: this.scanner.startPos,
                        end: this.scanner.pos,
                        text: this.scanner.getTokenText()
                    });
                    block.appendChild(lastRun);
                }
                this.scanner.scan();
            }
        }
        this.processDelimiters(undefined);
        this._collapseRuns(block);
    }

    private _parseInline(parent: IInlineContainer): Inline | undefined {
        for (const inlineSyntaxParser of this._inlineSyntaxParsers) {
            const inline: Inline | undefined = this.tryParse(inlineSyntaxParser.tryParseInline, parent);
            if (inline) {
                return inline;
            }
        }
        return undefined;
    }

    public processDelimiters(stackBottom: IDelimiterFrame | undefined): void {
        const openersBottom: Map<TokenLike, IDelimiterFrame | undefined>[] = [new Map(), new Map(), new Map()];
        for (const openers of openersBottom) {
            this._delimiterTokens.forEach((_, token) => { openers.set(token, stackBottom); });
        }

        // find first closer above stack_bottom:
        let closer: IDelimiterFrame | undefined = this._delimiters;
        while (closer && closer.prev !== stackBottom) {
            closer = closer.prev;
        }

        // move forward, looking for closers, and handling each
        let opener: IDelimiterFrame | undefined;
        while (closer) {
            if (!closer.canClose) {
                closer = closer.next;
                continue;
            }

            // found emphasis closer. now look back for first matching opener:
            const closerToken: TokenLike = closer.token;
            let openerFound: boolean = false;
            opener = closer.prev;
            while (opener && opener !== stackBottom && opener !== openersBottom[closer.count % 3].get(closerToken)) {
                if (opener.token === closer.token && opener.canOpen) {
                    const oddMatch: boolean =
                        (closer.canOpen || opener.canClose) &&
                        closer.count % 3 !== 0 &&
                        (opener.count + closer.count) % 3 === 0;
                    if (!oddMatch) {
                        openerFound = true;
                        break;
                    }
                }
                opener = opener.prev;
            }

            const oldCloser: IDelimiterFrame = closer;
            let processed: boolean = false;
            const processors = this._delimiterTokens.get(closer.token);
            if (processors) {
                for (const processor of Array.from(processors)) {
                    if (processor.processDelimiter) {
                        const result: IDelimiterFrame | "not-processed" | undefined = processor.processDelimiter(this, openerFound ? opener : undefined, closer);
                        if (result !== "not-processed") {
                            closer = result;
                            processed = true;
                            break;
                        }
                    }
                }
            }
            if (!processed) {
                throw new Error("Unprocessed delimiter");
            }
            if (!openerFound) {
                // Set lower bound for future searches for openers:
                openersBottom[oldCloser.count % 3].set(closerToken, oldCloser.prev);
                if (!oldCloser.canOpen) {
                    // We can remove a closer that can't be an opener,
                    // once we've seen there's no matching opener:
                    this.removeDelimiter(oldCloser);
                }
            }
        }

        // remove all delimiters
        while (this._delimiters && this._delimiters !== stackBottom) {
            this.removeDelimiter(this._delimiters);
        }
    }

    public parseReferences(): MarkdownLinkReference[] {
        const linkReferences: MarkdownLinkReference[] = [];
        let linkReference: MarkdownLinkReference | undefined = this.tryParse(MarkdownLinkReferenceSyntax.tryParse);
        while (linkReference) {
            linkReferences.push(linkReference);
            linkReference = this.tryParse(MarkdownLinkReferenceSyntax.tryParse);
        }
        return linkReferences;
    }

    public tryParse<A extends any[], T>(cb: (parser: InlineParser, ...args: A) => T | undefined, ...args: A): T | undefined {
        return this.scanner.speculate(/*lookAhead*/ false, InlineParser._tryParse, cb, this, args);
    }

    private static _tryParse<A extends any[], T>(cb: (parser: InlineParser, ...args: A) => T | undefined, parser: InlineParser, args: A): T | undefined {
        return cb(parser, ...args);
    }

    public pushDelimiter(processor: IDelimiterProcessor, node: Run, token: TokenLike, count: number, canOpen: boolean, canClose: boolean): void {
        let processors: Set<IDelimiterProcessor> | undefined = this._delimiterTokens.get(token);
        if (!processors) {
            processors = new Set();
            this._delimiterTokens.set(token, processors);
        }
        processors.add(processor);
        this._delimiters = {
            prev: this._delimiters,
            next: undefined,
            node,
            token,
            count,
            remaining: count,
            canOpen,
            canClose
        };
        if (this._delimiters.prev) {
            this._delimiters.prev.next = this._delimiters;
        }
    }

    public removeDelimiter(frame: IDelimiterFrame): void {
        if (frame.prev) {
            frame.prev.next = frame.next;
        }
        if (frame.next) {
            frame.next.prev = frame.prev;
        } else {
            this._delimiters = frame.prev;
        }
    }

    public removeDelimitersBetween(bottom: IDelimiterFrame, top: IDelimiterFrame): void {
        bottom.next = top;
        top.prev = bottom;
    }

    public peekBracket(): IBracketFrame | undefined {
        return this._brackets;
    }

    public pushBracket(node: Run, token: TokenLike): void {
        this._brackets = {
            prev: this._brackets,
            hasBracketAfter: false,
            delimiters: this._delimiters,
            node,
            token,
            active: true
        };
        if (this._brackets.prev) {
            this._brackets.prev.hasBracketAfter = true;
        }
    }

    public popBracket(): void {
        if (this._brackets) {
            this._brackets = this._brackets.prev;
        }
    }

    private _collapseRuns(container: Content) {
        if (container.isInlineContainer()) {
            let child: Content | undefined = container.firstChild;
            let lastRun: Run | undefined;
            while (child) {
                let next: Content | undefined = child.nextSibling;
                if (child instanceof Run) {
                    if (lastRun) {
                        lastRun.text += child.text;
                        lastRun.end = child.end;
                        child.removeNode();
                    } else {
                        lastRun = child;
                    }
                } else {
                    this._collapseRuns(child);
                    lastRun = undefined;
                }
                child = next;
            }
        } else if (container instanceof MarkdownHardBreak || container instanceof MarkdownSoftBreak) {
            const prev: Content | undefined = container.previousSibling;
            if (prev instanceof Run) {
                prev.text = prev.text.replace(/\s+$/, '');
                if (!prev.text) {
                    prev.removeNode();
                }
            }
        }
    }
}