import { Token } from "../Token";
import { InlineParser } from "../InlineParser";
import { MarkdownLinkScanner } from "../scanners/MarkdownLinkScanner";
import { Scanner } from "../Scanner";
import { MarkdownLinkLabel } from "../nodes/MarkdownLinkLabel";

export namespace MarkdownLinkLabelParser {
    export function tryParse(parser: InlineParser): MarkdownLinkLabel | undefined {
        const scanner: Scanner = parser.scanner;
        if (scanner.rescan(MarkdownLinkScanner.rescanLinkLabel) !== Token.LinkLabelToken) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        const text: string = scanner.getTokenValue();
        scanner.scan();

        const node: MarkdownLinkLabel = new MarkdownLinkLabel({ text });
        parser.setParserState(node, { pos, end });
        return node;
    }
}