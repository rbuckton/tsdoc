import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IInlineSyntax } from "../../IInlineSyntax";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { InlineParser, IBracketFrame } from "../../../parser/InlineParser";
import { TSDocWriter } from "../../../emitters/TSDocWriter";
import { Scanner } from "../../../parser/Scanner";
import { Token } from "../../../parser/Token";
import { TSDocTagName } from "../../../nodes/TSDocTagName";
import { TSDocTagNameSyntax } from "../elements/TSDocTagNameSyntax";
import { Inline } from "../../../nodes/Inline";
import { StandardTags } from "../../../../details/StandardTags";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { TSDocInlineTag } from "../../../nodes/TSDocInlineTag";
import { Run } from "../../../nodes/Run";
import { Content } from "../../../nodes/Content";
import { TSDocTagDefinition } from "../../../../configuration/TSDocTagDefinition";
import { TSDocMessageId } from "../../../../parser/TSDocMessageId";

export namespace TSDocInlineTagSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IInlineSyntax
        & IHtmlEmittable<TSDocInlineTag>
        & ITSDocEmittable<TSDocInlineTag>
    >(TSDocInlineTagSyntax);

    const openBraceAtToken = Symbol('OpenBraceAtToken'); // {@

    interface IInlineState {
        tagName?: TSDocTagName;
        destination?: string;
    }

    function createInlineState(): IInlineState {
        return {};
    }

    function getState(parser: InlineParser, node: Run): IInlineState {
        return parser.getState(TSDocInlineTagSyntax, node, createInlineState);
    }

    // TODO: This should either return a `string` or a `DeclarationReference`.
    function tryParseDestination(scanner: Scanner): string | undefined {
        const pos: number = scanner.startPos;
        while (scanner.token() !== Token.EndOfFileToken) {
            if (scanner.token() === Token.CloseBraceToken ||
                scanner.token() === Token.BarToken) {
                return scanner.slice(pos, scanner.startPos).trim();
            }
            scanner.scan();
        }
        return undefined;
    }

    function tryParseInlineTagStart(parser: InlineParser): Inline | undefined {
        const scanner: Scanner = parser.scanner;
        const pos: number = scanner.startPos;

        if (!scanner.expect(Token.OpenBraceToken) ||
            scanner.token() !== Token.AtToken) {
            return undefined;
        }

        const tagName: TSDocTagName | undefined = scanner.tryParse(TSDocTagNameSyntax.tryParseSyntaxElement);
        if (!tagName) {
            scanner.reportError(
                TSDocMessageId.MalformedInlineTag,
                'Expecting a TSDoc inline tag name after the "{@" characters'
            );
            return undefined;
        }

        // inline tag names must be followed by whitespace
        if (!scanner.scanWhitespaceAndNewLines()) {
            scanner.reportError(
                TSDocMessageId.CharactersAfterInlineTag,
                `The token ${JSON.stringify(scanner.getTokenText())} cannot appear after the TSDoc tag name; expecting a space`
            )
            return undefined;
        }

        // inline tags must have a destination
        const destinationPos: number = scanner.startPos;
        const destination: string | undefined = scanner.tryParse(tryParseDestination);
        if (destination === undefined) {
            return undefined;
        }

        const destinationEnd: number = scanner.startPos;
        const spaceAfterDestination: boolean = scanner.scanWhitespaceAndNewLines();
        const hasBar: boolean = scanner.expect(Token.BarToken);
        const spaceAfterBar: boolean = hasBar && scanner.scanWhitespaceAndNewLines();

        // inline tags are not treated as a bracket if they don't contain a `|` or a space.
        if (!(spaceAfterDestination || hasBar)) {
            // inline tags without text must end with a `}`
            if (!scanner.expect(Token.CloseBraceToken)) {
                scanner.reportError(
                    TSDocMessageId.MalformedInlineTag,
                    '"}" expected'
                );
                return undefined;
            }
            const end: number = scanner.startPos;
            const node: TSDocInlineTag = new TSDocInlineTag({ pos, end, tagName, destination });
            node.appendChild(new Run({ pos: destinationPos, end: destinationEnd, text: destination }));
            return node;
        }

        let text: string = `{${tagName.text} ${destination}`;
        if (spaceAfterDestination) {
            text += ' ';
        }
        if (hasBar) {
            text += '|';
            if (spaceAfterBar) {
                text += ' ';
            }
        }

        const end: number = scanner.startPos;
        const node: Run = new Run({ pos, end, text });
        const state: IInlineState = getState(parser, node);
        state.tagName = tagName;
        state.destination = destination;
        parser.pushBracket(node, openBraceAtToken, /*isLink*/ true);
        return node;
    }

    function tryParseInlineTagRest(parser: InlineParser) {
        const scanner: Scanner = parser.scanner;
        if (scanner.token() !== Token.CloseBraceToken) {
            return undefined;
        }

        const opener: IBracketFrame | undefined = parser.peekBracket();
        if (!opener || !opener.active) {
            if (opener) {
                parser.popBracket();
            }
            return undefined;
        }

        if (opener.token !== openBraceAtToken) {
            return undefined;
        }

        const { tagName, destination } = getState(parser, opener.node);
        if (!tagName || destination === undefined) {
            return undefined;
        }

        // consume the end bracket
        scanner.scan();

        const pos: number = opener.node.pos;
        const end: number = scanner.startPos;
        const node: TSDocInlineTag = new TSDocInlineTag({ pos, end, tagName, destination });

        // move everything between the opener and closer into the inline
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
        parser.closeOpenLinks();
        return node;
    }

    /**
     * Attempts to parse an Inline from the current token.
     *
     * NOTE: This function should be executed inside of a call to InlineParser.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param parser The parser used to parse the Inline.
     * @param container The container for the Inline.
     */
    export function tryParseInline(parser: InlineParser): Inline | undefined {
        return parser.tryParse(tryParseInlineTagStart)
            || parser.tryParse(tryParseInlineTagRest);
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: TSDocInlineTag): void {
        const tagDefinition: TSDocTagDefinition | undefined = writer.configuration.tryGetTagDefinition(node.tagName);
        if (tagDefinition !== StandardTags.link) {
            const tagName: string = tagDefinition ? tagDefinition.tagName : node.tagName;
            writer.writeTag('span', [['data-tagname', tagName]]);
            writer.writeTag('em');
            writer.write(tagName);
            writer.writeTag('/em');
            writer.writeRaw(' &mdash; ');
        }
        const attrs: [string, string][] = [];
        attrs.push(['href', writer.escapeText(node.destination)]);
        writer.writeTag('a', attrs);
        writer.writeContents(node);
        writer.writeTag('/a');
        if (tagDefinition !== StandardTags.link) {
            writer.writeTag('/span');
        }
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: TSDocInlineTag): void {
        const tagDefinition: TSDocTagDefinition | undefined = writer.configuration.tryGetTagDefinition(node.tagName);
        const tagName: string = tagDefinition ? tagDefinition.tagName : node.tagName;
        writer.write('{');
        writer.write(tagName);
        writer.write(' ');
        writer.write(node.destination);
        if (node.firstChildInline) {
            writer.write(' | ');
            writer.writeContents(node);
        }
        writer.write('}');
    }
}