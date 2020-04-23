import { InlineParser } from "../InlineParser";
import { Token } from "../Token";
import { Scanner } from "../Scanner";
import { MarkdownLineBreakScanner } from "../scanners/MarkdownLineBreakScanner";
import { MarkdownSoftBreak } from "../../nodes/MarkdownSoftBreak";
import { MarkdownHardBreak } from "../../nodes/MarkdownHardBreak";

export namespace MarkdownLineBreakParser {
    export function tryParse(parser: InlineParser): MarkdownSoftBreak | MarkdownHardBreak | undefined {
        const scanner: Scanner = parser.scanner;
        const token: Token = scanner.rescan(MarkdownLineBreakScanner.rescanLineBreak);
        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        switch (token) {
            case Token.NewLineTrivia:
                scanner.scan();
                return new MarkdownSoftBreak({ pos, end });
            case Token.SpaceSpaceHardBreakToken:
            case Token.BackslashHardBreakToken:
                scanner.scan();
                return new MarkdownHardBreak({ pos, end, breakToken: token });
        }

        return undefined;
    }
}