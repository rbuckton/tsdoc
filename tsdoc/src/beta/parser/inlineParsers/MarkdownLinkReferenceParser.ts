import { Token } from "../Token";
import { InlineParser } from "../InlineParser";
import { MarkdownLinkLabelParser } from "./MarkdownLinkLabelParser";
import { MarkdownLinkDestinationParser } from "./MarkdownLinkDestinationParser";
import { MarkdownLinkTitleParser } from "./MarkdownLinkTitleParser";
import { MarkdownUtils } from "../utils/MarkdownUtils";
import { MarkdownLinkTitle } from "../../nodes/MarkdownLinkTitle";
import { MarkdownLinkReference } from "../../nodes/MarkdownLinkReference";
import { MarkdownLinkLabel } from "../../nodes/MarkdownLinkLabel";
import { MarkdownLinkDestination } from "../../nodes/MarkdownLinkDestination";
import { Scanner } from "../Scanner";

export namespace MarkdownLinkReferenceParser {
    function tryParseLinkTitle(parser: InlineParser): MarkdownLinkTitle | undefined {
        const scanner: Scanner = parser.scanner;

        // ... optional whitespace (including up to one line ending) ...
        let hasWhitespace: boolean = scanner.scanWhitespaceAndSingleLine();

        // ... and an optional link title, which if it is present must be separated from the link
        // destination by whitespace.
        const linkTitle: MarkdownLinkTitle | undefined = hasWhitespace ?
            parser.tryParse(MarkdownLinkTitleParser.tryParse) :
            undefined;

        if (linkTitle) {
            if (!Token.isLineEnding(scanner.token())) {
                return undefined;
            }
        }
        return linkTitle;
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

        // a link label ...
        const label: MarkdownLinkLabel | undefined = parser.tryParse(MarkdownLinkLabelParser.tryParse);
        if (!label) {
            return undefined;
        }

        const scanner: Scanner = parser.scanner;

        // ... followed by a colon (:) ...
        if (!scanner.scanOptional(Token.ColonToken)) {
            return undefined;
        }

        // ... optional whitespace (including up to one line ending) ...
        scanner.scanWhitespaceAndSingleLine();

        // ... a link destination ...
        const destination: MarkdownLinkDestination | undefined = parser.tryParse(MarkdownLinkDestinationParser.tryParse);
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
}