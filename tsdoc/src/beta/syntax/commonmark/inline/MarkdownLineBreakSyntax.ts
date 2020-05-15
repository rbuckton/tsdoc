import { InlineParser } from "../../../parser/InlineParser";
import { Token, TokenLike } from "../../../parser/Token";
import { Scanner } from "../../../parser/Scanner";
import { MarkdownSoftBreak } from "../../../nodes/MarkdownSoftBreak";
import { MarkdownHardBreak } from "../../../nodes/MarkdownHardBreak";
import { Preprocessor } from "../../../parser/Preprocessor";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { Inline } from "../../../nodes/Inline";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IInlineSyntax } from "../../IInlineSyntax";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { SyntaxKind } from "../../../nodes/SyntaxKind";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";

export namespace MarkdownLineBreakSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IInlineSyntax
        & IHtmlEmittable<MarkdownHardBreak | MarkdownSoftBreak>
        & ITSDocEmittable<MarkdownHardBreak | MarkdownSoftBreak>
    >(MarkdownLineBreakSyntax);

    const spaceSpaceHardBreakToken = Symbol('SpaceSpaceHardBreakToken');    // (space)(space)\n
    const backslashHardBreakToken = Symbol('BackslashHardBreakToken');      // (backslash)\n

    function rescanLineBreak(scanner: Scanner): TokenLike | undefined {
        const preprocessor: Preprocessor = scanner.preprocessor;
        switch (scanner.token()) {
            case Token.SpaceTrivia:
                if (preprocessor.peekIsSequence(0,
                    CharacterCodes.space,
                    CharacterCodes.lineFeed)
                ) {
                    preprocessor.advance(2);
                    return scanner.setToken(spaceSpaceHardBreakToken);
                }
                break;
            case Token.BackslashToken:
                if (preprocessor.peekIs(0, CharacterCodes.lineFeed)) {
                    preprocessor.advance(1);
                    return scanner.setToken(backslashHardBreakToken);
                }
                break;
        }
        return undefined;
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
        const scanner: Scanner = parser.scanner;
        const token: TokenLike = scanner.rescan(rescanLineBreak);
        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        switch (token) {
            case Token.NewLineTrivia:
                scanner.scan();
                return new MarkdownSoftBreak({ pos, end });
            case spaceSpaceHardBreakToken:
            case backslashHardBreakToken:
                scanner.scan();
                return new MarkdownHardBreak({ pos, end, backslash: token === backslashHardBreakToken });
        }

        return undefined;
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: MarkdownHardBreak | MarkdownSoftBreak): void {
        switch (node.kind) {
            case SyntaxKind.MarkdownHardBreak:
                writer.writeTag('br', [], true);
                writer.writeLine();
                break;
            case SyntaxKind.MarkdownSoftBreak:
                writer.writeRaw('\n');
                break;
        }
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownHardBreak | MarkdownSoftBreak): void {
        switch (node.kind) {
            case SyntaxKind.MarkdownHardBreak:
                writer.write(node.backslash ? '\\' : '  ');
                writer.writeLine();
                break;
            case SyntaxKind.MarkdownSoftBreak:
                writer.writeLine();
                break;
        }
    }
}