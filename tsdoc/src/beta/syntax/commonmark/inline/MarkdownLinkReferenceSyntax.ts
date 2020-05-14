import { Token } from "../../../parser/Token";
import { InlineParser } from "../../../parser/InlineParser";
import { MarkdownLinkLabelSyntax } from "../elements/MarkdownLinkLabelSyntax";
import { MarkdownLinkDestinationSyntax } from "../elements/MarkdownLinkDestinationSyntax";
import { MarkdownLinkTitleSyntax } from "../elements/MarkdownLinkTitleSyntax";
import { MarkdownUtils } from "../../../utils/MarkdownUtils";
import { MarkdownLinkTitle } from "../../../nodes/MarkdownLinkTitle";
import { MarkdownLinkReference } from "../../../nodes/MarkdownLinkReference";
import { MarkdownLinkLabel } from "../../../nodes/MarkdownLinkLabel";
import { MarkdownLinkDestination } from "../../../nodes/MarkdownLinkDestination";
import { Scanner } from "../../../parser/Scanner";
import { SyntaxKind } from "../../../nodes/SyntaxKind";
import { BlockParser } from "../../../parser/BlockParser";
import { Block } from "../../../nodes/Block";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IBlockSyntax } from "../../IBlockSyntax";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";

export namespace MarkdownLinkReferenceSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IBlockSyntax<MarkdownLinkReference>
        & IHtmlEmittable<MarkdownLinkReference>
        & ITSDocEmittable<MarkdownLinkReference>
    >(MarkdownLinkReferenceSyntax);

    function tryParseLinkTitle(parser: InlineParser): MarkdownLinkTitle | undefined {
        const scanner: Scanner = parser.scanner;

        // ... optional whitespace (including up to one line ending) ...
        let hasWhitespace: boolean = scanner.scanWhitespaceAndSingleLine();

        // ... and an optional link title, which if it is present must be separated from the link
        // destination by whitespace.
        const linkTitle: MarkdownLinkTitle | undefined = hasWhitespace ?
            scanner.tryParse(MarkdownLinkTitleSyntax.tryParseSyntaxElement) :
            undefined;

        if (linkTitle) {
            if (!Token.isLineEnding(scanner.token())) {
                return undefined;
            }
        }
        return linkTitle;
    }

    export const kind: SyntaxKind.MarkdownLinkReference = SyntaxKind.MarkdownLinkReference;

    export function tryStartBlock(parser: BlockParser, container: Block): Block | undefined {
        // link references cannot be started.
        return undefined;
    }

    export function tryContinueBlock(parser: BlockParser, block: MarkdownLinkReference): boolean {
        // link references cannot be continued.
        return false;
    }

    export function finishBlock(parser: BlockParser, block: MarkdownLinkReference): void {
        // link references have no finish behavior.
    }

    export function tryParse(parser: InlineParser): MarkdownLinkReference | undefined {
        // https://spec.commonmark.org/0.29/#link-reference-definitions
        //
        // A link reference definition consists of a link label, indented up to three spaces,
        // followed by a colon (:), optional whitespace (including up to one line ending), a
        // link destination, optional whitespace (including up to one line ending), and an
        // optional link title, which if it is present must be separated from the link
        // destination by whitespace. No further non-whitespace characters may occur on the line.
        //

        const scanner: Scanner = parser.scanner;
        
        // a link label ...
        const label: MarkdownLinkLabel | undefined = scanner.tryParse(MarkdownLinkLabelSyntax.tryParseSyntaxElement);
        if (!label) {
            return undefined;
        }


        // ... followed by a colon (:) ...
        if (!scanner.expect(Token.ColonToken)) {
            return undefined;
        }

        // ... optional whitespace (including up to one line ending) ...
        scanner.scanWhitespaceAndSingleLine();

        // ... a link destination ...
        const destination: MarkdownLinkDestination | undefined = scanner.tryParse(MarkdownLinkDestinationSyntax.tryParseSyntaxElement);
        if (!destination) {
            return undefined;
        }

        // ... and an optional link title, which if it is present must be separated from the link
        // destination by whitespace.
        const title: MarkdownLinkTitle | undefined = parser.tryParse(tryParseLinkTitle);
        if (!Token.isLineEnding(scanner.token())) {
            return undefined;
        }

        const normalizedLabel: string = MarkdownUtils.normalizeLinkReference(label.text);
        if (!normalizedLabel) {
            return undefined;
        }

        const pos: number = label.pos;
        const end: number = scanner.startPos;
        const node: MarkdownLinkReference = new MarkdownLinkReference({
            pos,
            end,
            label,
            destination,
            title
        });

        scanner.scan();
        return node;
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: MarkdownLinkReference): void {
        // Does nothing.
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownLinkReference): void {
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
        if (!label || !destination) throw new Error('Invalid link reference.');
        writer.writeSyntax(label);
        writer.write(': ');
        writer.writeSyntax(destination);
        if (title) {
            writer.write(' ');
            writer.writeSyntax(title);
        }
    }
}