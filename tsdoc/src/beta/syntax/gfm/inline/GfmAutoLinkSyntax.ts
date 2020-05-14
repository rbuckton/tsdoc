import { InlineParser } from "../../../parser/InlineParser";
import { Scanner } from "../../../parser/Scanner";
import { Token, TokenLike } from "../../../parser/Token";
import { MarkdownLink } from "../../../nodes/MarkdownLink";
import { Run } from "../../../nodes/Run";
import { MarkdownUtils } from "../../../utils/MarkdownUtils";
import { Preprocessor } from "../../../parser/Preprocessor";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IInlineSyntax } from "../../IInlineSyntax";
import { IInlineContainer } from "../../../nodes/mixins/InlineContainerMixin";

export namespace GfmAutoLinkSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<IInlineSyntax>(GfmAutoLinkSyntax);

    // Special tokens for Gfm Autolinks
    const gfmUrlAutolinkToken = Symbol("GfmUrlAutolinkToken");  // http://www.commonmark.org
    const gfmWwwAutolinkToken = Symbol("GfmWwwAutolinkToken");  // www.commonmark.org
    const gfmEmailAddressToken = Symbol("GfmEmailAddress");     // user@domain

    function rescanGfmAutolink(scanner: Scanner, requireDot: boolean, token: TokenLike): TokenLike | undefined {
        // https://github.github.com/gfm/#valid-domain

        // A valid domain consists of segments of alphanumeric characters, underscores (_)
        // and hyphens (-) separated by periods (.). There must be at least one period, and
        // no underscores may be present in the last two segments of the domain.
        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);

        let lookAhead: number = 0;
        let hasDot: boolean = false;
        let underscoreInLastSegment: boolean = false;
        let underscoreInNextToLastSegment: boolean = false;
        while (!preprocessor.peekIsAny(lookAhead, UnicodeUtils.isLineTerminator, /*eof*/ undefined)) {
            if (preprocessor.peekIs(lookAhead, CharacterCodes.dot)) {
                hasDot = true;
                underscoreInNextToLastSegment = underscoreInLastSegment;
                underscoreInLastSegment = false;
            } else if (preprocessor.peekIs(lookAhead, CharacterCodes._)) {
                underscoreInLastSegment = true;
            } else if (preprocessor.peekIs(lookAhead, UnicodeUtils.isUnicodeWhitespace) ||
                preprocessor.peekIs(lookAhead, UnicodeUtils.isUnicodePunctuation) &&
                !preprocessor.peekIs(lookAhead, CharacterCodes.minus)) {
                break;
            }
            lookAhead++;
        }

        if (lookAhead === 0 ||
            underscoreInNextToLastSegment ||
            underscoreInLastSegment ||
            requireDot && !hasDot) {
            return undefined;
        }

        while (!preprocessor.peekIsAny(lookAhead,
            UnicodeUtils.isAsciiWhitespace,
            UnicodeUtils.isLineTerminator, /*eof*/ undefined)) {
            lookAhead++;
        }

        // https://github.github.com/gfm/#extended-autolink-path-validation
        for (let i: number = 0; i < lookAhead; i++) {
            // `<` immediately ends an autolink.
            if (preprocessor.peekIs(i, CharacterCodes.lessThan)) {
                lookAhead = i;
                break;
            }
        }

        while (lookAhead > 0) {
            // Trailing punctuation (specifically, `?`, `!`, `.`, `,`, `:`, `*`, `_`, and `~`) will
            // not be considered part of the autolink, though they may be included in the interior
            // of the link
            if (preprocessor.peekIsAny(lookAhead - 1,
                CharacterCodes.question,
                CharacterCodes.exclamation,
                CharacterCodes.dot,
                CharacterCodes.comma,
                CharacterCodes.asterisk,
                CharacterCodes._,
                CharacterCodes.tilde,
                CharacterCodes.apostrophe,
                CharacterCodes.quoteMark)) {
                lookAhead--;
                continue;
            }

            // When an autolink ends in `)`, we scan the entire autolink for the total number of parentheses.
            // If there is a greater number of closing parentheses than opening ones, we don’t consider the
            // unmatched trailing parentheses part of the autolink, in order to facilitate including an
            // autolink inside a parenthesis
            if (preprocessor.peekIs(lookAhead - 1, CharacterCodes.closeParen)) {
                let parenDepth: number = 0;
                for (let i: number = 0; i < lookAhead; i++) {
                    if (preprocessor.peekIs(i, CharacterCodes.openParen)) {
                        parenDepth++;
                    } else if (preprocessor.peekIs(i, CharacterCodes.closeParen)) {
                        parenDepth--;
                    }
                }
                if (parenDepth >= 0) {
                    break;
                }
                lookAhead--;
                continue;
            }

            // If an autolink ends in a semicolon (`;`), we check to see if it appears to resemble an
            // entity reference; if the preceding text is `&` followed by one or more alphanumeric
            // characters. If so, it is excluded from the autolink
            if (preprocessor.peekIs(lookAhead - 1, CharacterCodes.semiColon)) {
                let entityLookBehind: number = lookAhead - 2;
                while (entityLookBehind > 0 && preprocessor.peekIsAny(entityLookBehind, UnicodeUtils.isAsciiLetter, UnicodeUtils.isDecimalDigit)) {
                    entityLookBehind--;
                }
                if (entityLookBehind < lookAhead - 2 && preprocessor.peekIs(entityLookBehind, CharacterCodes.ampersand)) {
                    lookAhead = entityLookBehind;
                } else {
                    lookAhead--;
                }
                continue;
            }

            break;
        }

        if (lookAhead <= 0) {
            return undefined;
        }

        preprocessor.advance(lookAhead);
        return scanner.setToken(token);
    }

    const schemeHttp = 'http://';
    const schemeHttps = 'https://';
    const schemeFtp = 'ftp://';
    const schemeMailto = 'mailto:';

    function rescanGfmUrlAutolink(scanner: Scanner): TokenLike | undefined {
        // https://github.github.com/gfm/#extended-url-autolink
        if (scanner.token() !== Token.Text ||
            scanner.getTokenText() !== 'h' && scanner.getTokenText() !== 'f') {
            return undefined;
        }

        // An extended url autolink will be recognised when one of the schemes `http://`, or `https://` (or 'ftp://'
        // in the actual GFM implementation), followed by a valid domain, then zero or more non-space non-`<`
        // characters according to extended autolink path validation
        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);

        const leadChar: number = preprocessor.peekAt(scanner.startPos - 1) || CharacterCodes.lineFeed;
        const leadIsWhitespace: boolean = UnicodeUtils.isUnicodeWhitespace(leadChar);
        const leadIsPunctuation: boolean =
            leadChar === CharacterCodes.asterisk ||
            leadChar === CharacterCodes._ ||
            leadChar === CharacterCodes.tilde ||
            leadChar === CharacterCodes.openParen;

        if (!leadIsWhitespace && !leadIsPunctuation) {
            return undefined;
        }

        const sequence: string | undefined =
            preprocessor.peekIsSequence(0, schemeHttp) ? schemeHttp :
            preprocessor.peekIsSequence(0, schemeHttps) ? schemeHttps :
            preprocessor.peekIsSequence(0, schemeFtp) ? schemeFtp :
            undefined;

        if (sequence === undefined) {
            return undefined;
        }

        preprocessor.advance(UnicodeUtils.codePointCount(sequence));
        return rescanGfmAutolink(scanner, /*requireDot*/ false, gfmUrlAutolinkToken);
    }

    function rescanGfmWwwAutolink(scanner: Scanner): TokenLike | undefined {
        // https://github.github.com/gfm/#extended-www-autolink
        if (scanner.token() !== Token.Text ||
            scanner.getTokenText() !== 'w') {
            return undefined;
        }

        // An extended www autolink will be recognized when the text `www.` is found followed by a valid domain.
        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);

        const leadChar: number = preprocessor.peekAt(scanner.startPos - 1) || CharacterCodes.lineFeed;
        const leadIsWhitespace: boolean = UnicodeUtils.isUnicodeWhitespace(leadChar);
        const leadIsPunctuation: boolean =
            leadChar === CharacterCodes.asterisk ||
            leadChar === CharacterCodes._ ||
            leadChar === CharacterCodes.tilde ||
            leadChar === CharacterCodes.openParen;

        if (!leadIsWhitespace && !leadIsPunctuation) {
            return undefined;
        }

        if (!preprocessor.peekIsSequence(0, 'www.')) {
            return undefined;
        }

        return rescanGfmAutolink(scanner, /*requireDot*/ true, gfmWwwAutolinkToken);
    }

    function isEmailUserPart(codePoint: number | undefined): boolean {
        return UnicodeUtils.isAsciiLetter(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint)
            || codePoint === CharacterCodes.dot
            || codePoint === CharacterCodes.minus
            || codePoint === CharacterCodes._
            || codePoint === CharacterCodes.plus;
    }

    function isEmailLabelStart(codePoint: number | undefined): boolean {
        return UnicodeUtils.isAsciiLetter(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint);
    }

    function isEmailLabelEnd(codePoint: number | undefined): boolean {
        return UnicodeUtils.isAsciiLetter(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint);
    }

    function isEmailLabelPart(codePoint: number | undefined): boolean {
        return isEmailLabelStart(codePoint)
            || codePoint === CharacterCodes.minus
            || codePoint === CharacterCodes._;
    }

    function rescanEmailAddress(scanner: Scanner): TokenLike | undefined {
        // https://github.github.com/gfm/#extended-email-autolink
        if (!Token.isTextLike(scanner.token())) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);

        let lookAhead: number = preprocessor.peekCount(0, isEmailUserPart);
        if (lookAhead <= 0 || !preprocessor.peekIs(lookAhead, CharacterCodes.at)) {
            return undefined;
        }

        let hasDot: boolean = false;
        do {
            lookAhead++; // for the `@` or `.`
            const domainCount: number = preprocessor.peekMaxCount(lookAhead, 63,
                isEmailLabelStart,
                isEmailLabelPart,
                isEmailLabelEnd) || 0;
            if (domainCount <= 0) {
                if (hasDot) {
                    lookAhead--;
                    break;
                }
                return undefined;
            }
            lookAhead += domainCount;
            if (preprocessor.peekIs(lookAhead, CharacterCodes.dot)) {
                hasDot = true;
            }
        }
        while (preprocessor.peekIs(lookAhead, CharacterCodes.dot));
        if (!hasDot || preprocessor.peekIsAny(lookAhead - 1, CharacterCodes.minus, CharacterCodes._)) {
            return undefined;
        }

        preprocessor.advance(lookAhead);
        return scanner.setToken(gfmEmailAddressToken);
    }

    function tryParseUrl(parser: InlineParser): MarkdownLink | undefined {
        const scanner: Scanner = parser.scanner;
        const pos: number = scanner.startPos;
        if (scanner.rescan(rescanGfmUrlAutolink) !== gfmUrlAutolinkToken) {
            return undefined;
        }

        const text: string = scanner.getTokenValue();
        const end: number = scanner.pos;
        scanner.scan();

        const run: Run = new Run({ pos, end, text });
        const node: MarkdownLink = new MarkdownLink({
            pos,
            end,
            content: run,
            destination: MarkdownUtils.normalizeURL(text)
        });
        return node;
    }

    function tryParseWww(parser: InlineParser): MarkdownLink | undefined {
        const scanner: Scanner = parser.scanner;
        const pos: number = scanner.startPos;
        if (scanner.rescan(rescanGfmWwwAutolink) !== gfmWwwAutolinkToken) {
            return undefined;
        }

        const text: string = scanner.getTokenValue();
        const end: number = scanner.pos;
        scanner.scan();

        const run: Run = new Run({ pos, end, text });
        const node: MarkdownLink = new MarkdownLink({
            pos,
            end,
            content: run,
            destination: MarkdownUtils.normalizeURL(schemeHttp + text)
        });
        return node;
    }

    function tryParseEmail(parser: InlineParser): MarkdownLink | undefined {
        const scanner: Scanner = parser.scanner;
        const pos: number = scanner.startPos;
        if (scanner.rescan(rescanEmailAddress) !== gfmEmailAddressToken) {
            return undefined;
        }

        const text: string = scanner.getTokenValue();
        const end: number = scanner.pos;
        scanner.scan();

        const run: Run = new Run({ pos, end, text });
        const node: MarkdownLink = new MarkdownLink({
            pos,
            end,
            content: run,
            destination: MarkdownUtils.normalizeURL(schemeMailto + text)
        });
        return node;
    }

    export function tryParseInline(parser: InlineParser, parent: IInlineContainer): MarkdownLink | undefined {
        // https://github.github.com/gfm/#autolinks-extension-
        if (parser.peekBracket()) {
            return undefined;
        }

        return tryParseUrl(parser)
            || tryParseWww(parser)
            || tryParseEmail(parser);
    }
}
