import { InlineParser, IBracketFrame } from "../../../parser/InlineParser";
import { Scanner } from "../../../parser/Scanner";
import { Token, TokenLike } from "../../../parser/Token";
import { Run } from "../../../nodes/Run";
import { MarkdownLinkLabelSyntax } from "../elements/MarkdownLinkLabelSyntax";
import { MarkdownLinkLabel } from "../../../nodes/MarkdownLinkLabel";
import { MarkdownUtils } from "../../../utils/MarkdownUtils";
import { MarkdownLinkTitle } from "../../../nodes/MarkdownLinkTitle";
import { MarkdownLinkDestination } from "../../../nodes/MarkdownLinkDestination";
import { MarkdownLink } from "../../../nodes/MarkdownLink";
import { MarkdownImage } from "../../../nodes/MarkdownImage";
import { MarkdownLinkDestinationSyntax } from "../elements/MarkdownLinkDestinationSyntax";
import { MarkdownLinkTitleSyntax } from "../elements/MarkdownLinkTitleSyntax";
import { Inline } from "../../../nodes/Inline";
import { Preprocessor } from "../../../parser/Preprocessor";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IInlineSyntax } from "../../IInlineSyntax";
import { SyntaxKind } from "../../../nodes/SyntaxKind";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";
import { Content } from "../../../nodes/Content";

export namespace MarkdownLinkSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IInlineSyntax
        & IHtmlEmittable<MarkdownLink | MarkdownImage>
        & ITSDocEmittable<MarkdownLink | MarkdownImage>
    >(MarkdownLinkSyntax);

    // Special tokens for links
    const exclamationOpenBracketToken = Symbol('ExclamationOpenBracketToken'); // ![

    function rescanExclamationOpenBracketToken(scanner: Scanner): TokenLike | undefined {
        if (scanner.token() === Token.ExclamationToken) {
            const preprocessor: Preprocessor = scanner.preprocessor;
            if (preprocessor.peekIs(0, CharacterCodes.openBracket)) {
                preprocessor.read();
                return scanner.setToken(exclamationOpenBracketToken);
            }
        }
        return undefined;
    }

    function tryParseLinkOrImageStart(parser: InlineParser): Run | undefined {
        // Try to parse the starting `[` or `![` of the link/image.
        const scanner: Scanner = parser.scanner;
        const token: TokenLike = scanner.rescan(rescanExclamationOpenBracketToken);
        if (token !== Token.OpenBracketToken &&
            token !== exclamationOpenBracketToken) {
            return undefined;
        }

        // consume the bracket
        const text: string = scanner.getTokenText();
        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        scanner.scan();

        // push the bracket and return it.
        const node: Run = new Run({ pos, end, text });
        parser.pushBracket(node, token, /*isLink*/ token === Token.OpenBracketToken);
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
        if (!scanner.expect(Token.OpenParenToken)) {
            return undefined;
        }

        scanner.scanWhitespaceAndSingleLine();

        const destination: MarkdownLinkDestination | undefined =
            scanner.tryParse(MarkdownLinkDestinationSyntax.tryParseSyntaxElement);

        scanner.scanWhitespaceAndSingleLine();

        const title: MarkdownLinkTitle | undefined =
            scanner.tryParse(MarkdownLinkTitleSyntax.tryParseSyntaxElement);

        if (title) {
            scanner.scanWhitespaceAndSingleLine();
        }

        if (!scanner.expect(Token.CloseParenToken)) {
            return undefined;
        }

        return { kind: "inline", destination, title };
    }

    interface IReferenceLink {
        kind: "reference";
        label: MarkdownLinkLabel | string;
    }

    function tryParseReferenceLink(parser: InlineParser, opener: IBracketFrame, pos: number): IReferenceLink | undefined {
        const scanner: Scanner = parser.scanner;
        const label: MarkdownLinkLabel | undefined = scanner.tryParse(MarkdownLinkLabelSyntax.tryParseSyntaxElement);

        let refLabel: string | undefined;
        if (label && label.text) {
            refLabel = label.text;
        } else if (!opener.hasBracketAfter) {
            // Empty or missing second label means to use the first label as the reference.
            // The reference must not contain a bracket. If we know there's a bracket, we don't
            // even bother checking it.
            refLabel = scanner.slice(opener.node.end, pos);
            if (label) {
                label.text = refLabel;
            }
        }

        // A reference link is only valid if the reference already exists in the reference map.
        if (refLabel) {
            refLabel = MarkdownUtils.normalizeLinkReference(refLabel);
            if (parser.document.referenceMap.has(refLabel)) {
                return { kind: "reference", label: label || refLabel };
            }
        }

        return undefined;
    }

    type LinkInfo =
        | IInlineLink
        | IReferenceLink
        ;

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
        if (opener.token !== exclamationOpenBracketToken &&
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
        let label: MarkdownLinkLabel | string | undefined;
        switch (linkInfo.kind) {
            case "inline":
                destination = linkInfo.destination;
                title = linkInfo.title;
                break;
            case "reference":
                label = linkInfo.label;
                break;
        }

        // Create either a link or an image based on the opening bracket.
        const pos: number = opener.node.pos;
        const end: number = scanner.startPos;
        const node: MarkdownImage | MarkdownLink = opener.token === exclamationOpenBracketToken ?
            new MarkdownImage({ pos, end, destination, title, label }) :
            new MarkdownLink({ pos, end, destination, title, label });

        // move everything between the open and closer into the inline
        let current: Inline | undefined = opener.node.nextSiblingInline;
        let next: Content | undefined;
        while (current) {
            next = current.nextSibling;
            node.appendChild(current);
            current = next && next.isInline() ? next : undefined;
        }

        // process emphasis delimiters inside of the link text
        parser.processDelimiters(opener.delimiters);
        parser.popBracket();
        opener.node.removeNode();

        // Links cannot have nested links.
        if (opener.token === Token.OpenBracketToken) {
            parser.closeOpenLinks();
        }

        return node;
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
        return parser.tryParse(tryParseLinkOrImageStart)
            || parser.tryParse(tryParseLinkOrImageRest);
    }

    function emitHtmlMarkdownLink(writer: HtmlWriter, node: MarkdownLink): void {
        const attrs: [string, string][] = [];
        attrs.push(['href', writer.escapeText(node.destination)]);
        if (node.title) {
            attrs.push(['title', writer.escapeText(node.title)]);
        }
        writer.writeTag('a', attrs);
        writer.writeContents(node);
        writer.writeTag('/a');
    }

    function emitHtmlMarkdownImage(writer: HtmlWriter, node: MarkdownImage): void {
        if (!writer.tagsDisabled) {
            writer.writeRaw('<img src="' + writer.escapeText(node.destination) + '" alt="');
        }
        writer.disableTags();
        writer.writeContents(node);
        writer.enableTags();
        if (!writer.tagsDisabled) {
            if (node.title) {
                writer.writeRaw('" title="' + writer.escapeText(node.title));
            }
            writer.writeRaw('" />');
        }
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: MarkdownLink | MarkdownImage): void {
        switch (node.kind) {
            case SyntaxKind.MarkdownLink: return emitHtmlMarkdownLink(writer, node);
            case SyntaxKind.MarkdownImage: return emitHtmlMarkdownImage(writer, node);
        }
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownLink | MarkdownImage): void {
        writer.write(node.kind === SyntaxKind.MarkdownLink ? '[' : '![');
        writer.writeContents(node);
        writer.write(']');
        let destination: MarkdownLinkDestination | undefined;
        let title: MarkdownLinkTitle | undefined;
        let label: MarkdownLinkLabel | undefined;
        for (const syntax of node.getSyntaxElements()) {
            switch (syntax.kind) {
                case SyntaxKind.MarkdownLinkDestination:
                    destination = syntax as MarkdownLinkDestination;
                    break;
                case SyntaxKind.MarkdownLinkTitle:
                    title = syntax as MarkdownLinkTitle;
                    break;
                case SyntaxKind.MarkdownLinkLabel:
                    label = syntax as MarkdownLinkLabel;
                    break;
            }
        }
        if (destination) {
            writer.write('(');
            writer.writeSyntax(destination);
            if (title) {
                writer.write(' ');
                writer.writeSyntax(title);
            }
            writer.write(')');
        } else {
            if (label) {
                writer.writeSyntax(label);
            }
        }
    }
}