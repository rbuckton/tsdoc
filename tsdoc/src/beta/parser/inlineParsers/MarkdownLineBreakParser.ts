import { InlineParser } from "../InlineParser";
import { Token } from "../Token";
import { Scanner } from "../Scanner";
import { MarkdownLineBreakScanner } from "../scanners/MarkdownLineBreakScanner";
import { MarkdownSoftBreak } from "../nodes/MarkdownSoftBreak";
import { MarkdownHardBreak } from "../nodes/MarkdownHardBreak";

export namespace MarkdownLineBreakParser {
    export function tryParse(parser: InlineParser): MarkdownSoftBreak | MarkdownHardBreak | undefined {
        const scanner: Scanner = parser.scanner;
        const pos: number = scanner.startPos;
        const token: Token = scanner.rescan(MarkdownLineBreakScanner.rescanLineBreak);
        switch (token) {
            case Token.NewLineTrivia:
                scanner.scan();
                return parser.setNodePos(new MarkdownSoftBreak(), pos, scanner.startPos);
            case Token.SpaceSpaceHardBreakToken:
            case Token.BackslashHardBreakToken:
                scanner.scan();
                return parser.setNodePos(new MarkdownHardBreak({ breakToken: token }), pos, scanner.startPos);
        }

        return undefined;
    }
}