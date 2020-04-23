import { StartResult, ContinueResult } from "./IBlockSyntaxParser";
import { BlockParser } from "../BlockParser";
import { SyntaxKind } from "../../nodes/SyntaxKind";
import { Token } from "../Token";
import { MarkdownHeadingScanner } from "../scanners/MarkdownHeadingScanner";
import { ContentWriter } from "../ContentWriter";
import { Scanner } from "../Scanner";
import { MarkdownHeading } from "../../nodes/MarkdownHeading";
import { MarkdownParagraph } from "../../nodes/MarkdownParagraph";
import { Block } from "../../nodes/Block";

export namespace MarkdownHeadingParser {
    export const kind: SyntaxKind.MarkdownHeading = SyntaxKind.MarkdownHeading;

    export function tryStart(parser: BlockParser, container: Block): StartResult {
        // https://spec.commonmark.org/0.29/#atx-headings
        //
        // - An ATX heading consists of [...] an opening sequence of 1–6 unescaped `#` characters [...].
        // - The opening sequence of `#` characters must be followed by a space or by the end of line.
        // - The opening `#` character may be indented 0-3 spaces.
        // - The heading level is equal to the number of `#` characters in the opening sequence.
        const scanner: Scanner = parser.scanner;
        if (parser.indent <= 3) {
            const token: Token = scanner.rescan(MarkdownHeadingScanner.rescanAtxHeadingToken);
            if (token === Token.AtxHeadingToken) {
                const pos: number = scanner.startPos;
                const level: number = scanner.getTokenText().length;
                scanner.scan();
                scanner.scanWhitespace();
                const startPos: number = scanner.startPos;
                const text: string = scanner.scanLine();
                const content: ContentWriter = new ContentWriter();
                // do not add content if it consists of only a string of `#` characters
                // if (!(/^#+$/.test(text))) {
                    // trim any trailing `#` characters from the line
                    content.addMapping(startPos);
                    // content.write(text.replace(/[ \t]*#+$/, ""));
                    content.write(text.replace(/^[ \t]*#+[ \t]*$/, '').replace(/[ \t]+#+[ \t]*$/, ''));
                // }
                parser.finishUnmatchedBlocks();
                const block: MarkdownHeading = parser.pushBlock(new MarkdownHeading({ headingToken: token, level }), pos);
                parser.getParserState(block).content = content;
                return StartResult.Leaf;
            } else if (container.kind === SyntaxKind.MarkdownParagraph) {
                const token: Token = scanner.rescan(MarkdownHeadingScanner.rescanSetextHeadingToken);
                if (Token.isSetextHeading(token)) {
                    parser.finishUnmatchedBlocks();
                    if (parser.getParserState(container).content) {
                        parser.parseReferences(container as MarkdownParagraph);
                        const newContent: ContentWriter | undefined = parser.getParserState(container).content;
                        if (newContent && newContent.length > 0) {
                            const heading: MarkdownHeading = new MarkdownHeading({
                                pos: container.pos,
                                end: container.end,
                                headingToken: token,
                                level: token === Token.EqualsSetextHeadingToken ? 1 : 2,
                            });
                            parser.getParserState(heading).content = newContent;
                            container.insertSiblingAfter(heading);
                            container.removeNode();
                            parser.setTip(heading);
                            scanner.scanLine();
                            return StartResult.Leaf;
                        }
                    }
                }
            }
        }
        return StartResult.Unmatched;
    }

    export function tryContinue(_parser: BlockParser, _block: MarkdownHeading): ContinueResult {
        // headings cannot match more than one line.
        return ContinueResult.Unmatched;
    }

    export function finish(_parser: BlockParser, _block: MarkdownHeading): void {
        // Documents have no finish behavior.
    }
}
