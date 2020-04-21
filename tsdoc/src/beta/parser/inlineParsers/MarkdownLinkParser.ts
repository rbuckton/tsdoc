import { InlineParser, IBracketFrame } from "../InlineParser";
import { Scanner } from "../Scanner";
import { Token } from "../Token";
import { Run } from "../nodes/Run";
import { MarkdownLinkScanner } from "../scanners/MarkdownLinkScanner";
import { MarkdownLinkLabelParser } from "./MarkdownLinkLabelParser";
import { MarkdownLinkLabel } from "../nodes/MarkdownLinkLabel";
import { MarkdownUtils } from "../utils/MarkdownUtils";
import { MarkdownLinkTitle } from "../nodes/MarkdownLinkTitle";
import { MarkdownLinkDestination } from "../nodes/MarkdownLinkDestination";
import { MarkdownLink } from "../nodes/MarkdownLink";
import { MarkdownImage } from "../nodes/MarkdownImage";
import { MarkdownLinkDestinationParser } from "./MarkdownLinkDestinationParser";
import { MarkdownLinkTitleParser } from "./MarkdownLinkTitleParser";
import { Inline } from "../nodes/Inline";

export namespace MarkdownLinkParser {
    function tryParseLinkOrImageStart(parser: InlineParser): Run | undefined {
        // Try to parse the starting `[` or `![` of the link/image.
        const scanner: Scanner = parser.scanner;
        const token: Token = scanner.rescan(MarkdownLinkScanner.rescanExclamationOpenBracketToken);
        if (token !== Token.OpenBracketToken &&
            token !== Token.ExclamationOpenBracketToken) {
            return undefined;
        }

        // consume the bracket
        const text: string = scanner.getTokenText();
        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        scanner.scan();

        // push the bracket and return it.
        const node: Run = new Run();
        parser.setParserState(node, { pos, end, text });
        parser.pushBracket(node, token);
        return node;
    }

    interface IInlineLink {
        kind: "inline";
        destination?: MarkdownLinkDestination;
        title?: MarkdownLinkTitle;
    }

    function tryParseInlineLink(parser: InlineParser): IInlineLink | undefined {
        const scanner: Scanner = parser.scanner;

        // https://spec.commonmark.org/0.29/#inline-link
        if (!scanner.scanOptional(Token.OpenParenToken)) {
            return undefined;
        }

        scanner.scanWhitespaceAndSingleLine();

        const destination: MarkdownLinkDestination | undefined =
            parser.tryParse(MarkdownLinkDestinationParser.tryParse);

        scanner.scanWhitespaceAndSingleLine();

        const title: MarkdownLinkTitle | undefined =
            parser.tryParse(MarkdownLinkTitleParser.tryParse);

        if (title) {
            scanner.scanWhitespaceAndSingleLine();
        }

        if (!scanner.scanOptional(Token.CloseParenToken)) {
            return undefined;
        }

        return { kind: "inline", destination, title };
    }

    interface IReferenceLink {
        kind: "reference";
        refLabel: string;
        label?: MarkdownLinkLabel;
    }

    function tryParseReferenceLink(parser: InlineParser, opener: IBracketFrame, pos: number): IReferenceLink | undefined {
        const scanner: Scanner = parser.scanner;
        const label: MarkdownLinkLabel | undefined = parser.tryParse(MarkdownLinkLabelParser.tryParse);

        let refLabel: string | undefined;
        if (label && label.text) {
            refLabel = label.text;
        } else if (!opener.hasBracketAfter) {
            // Empty or missing second label means to use the first label as the reference.
            // The reference must not contain a bracket. If we know there's a bracket, we don't
            // even bother checking it.
            refLabel = scanner.slice(opener.node.end, pos);
        }

        // A reference link is only valid if the reference already exists in the reference map.
        if (refLabel) {
            refLabel = MarkdownUtils.normalizeLinkReference(refLabel);
            if (parser.document.referenceMap.has(refLabel)) {
                return { kind: "reference", label, refLabel };
            }
        }

        return undefined;
    }

    type LinkInfo =
        | IInlineLink
        | IReferenceLink
        ;

    function closeOpenLinks(parser: InlineParser) {
        let opener: IBracketFrame | undefined = parser.peekBracket();
        while (opener) {
            if (opener.token === Token.OpenBracketToken) {
                opener.active = false;
            }
            opener = opener.prev;
        }
    }

    /**
     * Try to match close bracket against an opening in the delimiter
     * stack. Add either a link or image, or a plain `[` character,
     * to block's children. If there is a matching delimiter,
     * remove it from the delimiter stack.
     */
    function tryParseLinkOrImageRest(parser: InlineParser): MarkdownLink | MarkdownImage | undefined {
        const scanner: Scanner = parser.scanner;
        if (scanner.token() !== Token.CloseBracketToken) {
            return undefined;
        }

        // get the last `[` or `![` pushed onto the bracket stack.
        const opener: IBracketFrame | undefined = parser.peekBracket();
        if (!opener || !opener.active) {
            // if no matched opener, let some other parser handle it.
            if (opener) {
                // take opener off bracket stack.
                parser.popBracket();
            }
            return undefined;
        }

        // check to make sure we have the correct opener
        if (opener.token !== Token.ExclamationOpenBracketToken &&
            opener.token !== Token.OpenBracketToken) {
            // let some other parser handle it.
            return undefined;
        }

        // consume the end bracket
        const bracketPos: number = scanner.startPos;
        scanner.scan();

        // Try to parse either an inline link (i.e., `(url title)`), or a
        // reference link (i.1., `[label]`, `[]`, or ``).
        const linkInfo: LinkInfo | undefined =
            parser.tryParse(tryParseInlineLink) ||
            parser.tryParse(tryParseReferenceLink, opener, bracketPos);

        if (!linkInfo) {
            // if we failed to parse a link, remove the opener from the
            // bracket stack and let some other parser handle the bracket.
            parser.popBracket();
            return undefined;
        }

        let destination: MarkdownLinkDestination | undefined;
        let title: MarkdownLinkTitle | undefined;
        let label: MarkdownLinkLabel | undefined;
        let refLabel: string | undefined;
        switch (linkInfo.kind) {
            case "inline":
                destination = linkInfo.destination;
                title = linkInfo.title;
                break;
            case "reference":
                label = linkInfo.label;
                refLabel = linkInfo.refLabel;
                break;
        }

        // Create either a link or an image based on the opening bracket.
        let node: MarkdownLink | MarkdownImage;
        switch (opener.token) {
            case Token.ExclamationOpenBracketToken:
                node = new MarkdownImage({ destination, title, label });
                break;
            default:
                node = new MarkdownLink({ destination, title, label });
                break;
        }

        const pos: number = opener.node.pos;
        const end: number = scanner.startPos;
        parser.setParserState(node, { pos, end, refLabel });

        // move everything between the open and closer into the inline
        let current: Inline | undefined = opener.node.nextSiblingInline;
        let next: Inline | undefined;
        while (current) {
            next = current.nextSiblingInline;
            node.appendChild(current);
            current = next;
        }

        // process emphais delimiters inside of the link text
        parser.processDelimiters(opener.delimiters);
        parser.popBracket();
        opener.node.removeNode();

        // Links cannot have nested links.
        if (opener.token === Token.OpenBracketToken) {
            closeOpenLinks(parser);
        }

        return node;
    }

    export function tryParse(parser: InlineParser): Run | MarkdownLink | MarkdownImage | undefined {
        return tryParseLinkOrImageStart(parser)
            || tryParseLinkOrImageRest(parser);
    }
}