import { Token } from "./Token";
import { IInlineSyntaxParser } from "./inlineParsers/IInlineSyntaxParser";
import { IDelimiterProcessor } from "./inlineParsers/IDelimiterProcessor";
import { MarkdownLineBreakParser } from "./inlineParsers/MarkdownLineBreakParser";
import { MarkdownCodeSpanParser } from "./inlineParsers/MarkdownCodeSpanParser";
import { MarkdownBackslashEscapeParser } from "./inlineParsers/MarkdownBackslashEscapeParser";
import { MarkdownDelimiterParser } from "./inlineParsers/MarkdownDelimiterParser";
import { MarkdownLinkParser } from "./inlineParsers/MarkdownLinkParser";
import { MarkdownAutoLinkParser } from "./inlineParsers/MarkdownAutoLinkParser";
import { MarkdownHtmlInlineParser } from "./inlineParsers/MarkdownHtmlInlineParser";
import { MarkdownCharacterEntityParser } from "./inlineParsers/MarkdownCharacterEntityParser";
import { Inline, IInlineContainer } from "../nodes/Inline";
import { Run } from "../nodes/Run";
import { MarkdownLinkReference } from "../nodes/MarkdownLinkReference";
import { IMapping } from "./Mapper";
import { MarkdownLinkReferenceParser } from "./inlineParsers/MarkdownLinkReferenceParser";
import { ParserBase } from "./ParserBase";
import { Content } from "../nodes/Content";
import { Document } from "../nodes/Document";
import { MarkdownHardBreak } from "../nodes/MarkdownHardBreak";
import { MarkdownSoftBreak } from "../nodes/MarkdownSoftBreak";
import { GfmStrikethroughParser } from "./inlineParsers/GfmStrikethroughParser";
import { GfmAutoLinkParser } from "./inlineParsers/GfmAutoLinkParser";

export interface IDelimiterFrame {
    prev?: IDelimiterFrame;
    next?: IDelimiterFrame;
    readonly node: Run;
    readonly token: Token;
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
    readonly token: Token;
    active: boolean;
}

export class InlineParser extends ParserBase {
    private _document: Document;
    private _delimiterTokens: Set<Token> = new Set();
    private _delimiters: IDelimiterFrame | undefined;
    private _brackets: IBracketFrame | undefined;
    private _inlineSyntaxParsers: IInlineSyntaxParser<Inline>[];
    private _delimiterProcessors: IDelimiterProcessor[];

    public constructor(document: Document, text: string, sourceMappings: ReadonlyArray<IMapping> | undefined, gfm: boolean) {
        super(text.replace(/\s+$/, ''), sourceMappings);
        this._document = document;
        this._inlineSyntaxParsers = InlineParser.getDefaultInlineSyntaxParsers(gfm);
        this._delimiterProcessors = InlineParser.getDefaultDelimiterParsers(gfm);
        this.scanner.scan();
    }

    public static getDefaultInlineSyntaxParsers(gfm: boolean): IInlineSyntaxParser<Inline>[] {
        return [
            MarkdownLineBreakParser,
            MarkdownBackslashEscapeParser,
            MarkdownCodeSpanParser,
            MarkdownDelimiterParser,
            ...(gfm ? [GfmStrikethroughParser] : []),
            MarkdownLinkParser,
            ...(gfm ? [GfmAutoLinkParser] : []),
            MarkdownAutoLinkParser,
            MarkdownHtmlInlineParser,
            MarkdownCharacterEntityParser,
        ];
    }

    public static getDefaultDelimiterParsers(gfm: boolean): IDelimiterProcessor[] {
        return [
            MarkdownDelimiterParser,
            ...(gfm ? [GfmStrikethroughParser] : [])
        ];
    }

    public get document(): Document {
        return this._document;
    }

    public parse(block: IInlineContainer): void {
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
            const inline: Inline | undefined = this.tryParse(inlineSyntaxParser.tryParse, parent);
            if (inline) {
                return inline;
            }
        }
        return undefined;
    }

    public processDelimiters(stackBottom: IDelimiterFrame | undefined): void {
        const openersBottom: Array<IDelimiterFrame | undefined>[] = [[], [], []];
        for (const openers of openersBottom) {
            this._delimiterTokens.forEach(token => { openers[token] = stackBottom; });
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
            const closerToken: Token = closer.token;
            let openerFound: boolean = false;
            opener = closer.prev;
            while (opener && opener !== stackBottom && opener !== openersBottom[closer.count % 3][closerToken]) {
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
            for (const processor of this._delimiterProcessors) {
                const result: IDelimiterFrame | "not-processed" | undefined = processor.processDelimiter(this, openerFound ? opener : undefined, closer);
                if (result !== "not-processed") {
                    closer = result;
                    processed = true;
                    break;
                }
            }
            if (!processed) {
                throw new Error("Unprocessed delimiter");
            }
            if (!openerFound) {
                // Set lower bound for future searches for openers:
                openersBottom[oldCloser.count % 3][closerToken] = oldCloser.prev;
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
        let linkReference: MarkdownLinkReference | undefined = this.tryParse(MarkdownLinkReferenceParser.tryParse);
        while (linkReference) {
            linkReferences.push(linkReference);
            linkReference = this.tryParse(MarkdownLinkReferenceParser.tryParse);
        }
        return linkReferences;
    }

    public tryParse<A extends any[], T>(cb: (parser: InlineParser, ...args: A) => T | undefined, ...args: A): T | undefined {
        return this.scanner.speculate(/*lookAhead*/ false, cb.bind(undefined, this), ...args);
    }

    public pushDelimiter(node: Run, token: Token, count: number, canOpen: boolean, canClose: boolean): void {
        this._delimiterTokens.add(token);
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

    public pushBracket(node: Run, token: Token): void {
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