import { InlineParser } from "../../../parser/InlineParser";
import { MarkdownCodeSpan } from "../../../nodes/MarkdownCodeSpan";
import { Scanner } from "../../../parser/Scanner";
import { Token, TokenLike } from "../../../parser/Token";
import { Run } from "../../../nodes/Run";
import { Preprocessor } from "../../../parser/Preprocessor";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { Inline } from "../../../nodes/Inline";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IInlineSyntax } from "../../IInlineSyntax";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";
import { StringUtils } from "../../../utils/StringUtils";

export namespace MarkdownCodeSpanSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IInlineSyntax
        & IHtmlEmittable<MarkdownCodeSpan>
        & ITSDocEmittable<MarkdownCodeSpan>
    >(MarkdownCodeSpanSyntax);

    // Special tokens for code spans
    const backtickStringToken = Symbol('BacktickStringToken');  // ` or `` or ``` ...
    const codeSpanToken = Symbol('CodeSpanToken');              // `a` or `` a`b `` ...

    function rescanBacktickString(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#backtick-string
        if (scanner.token() !== Token.BacktickToken) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);

        // scan the number of backticks
        const backtickCount: number = preprocessor.peekCount(0, CharacterCodes.backtick);
        preprocessor.advance(backtickCount);

        return scanner.setToken(backtickStringToken);
    }

    function rescanCodeSpan(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#code-span
        if (scanner.token() !== Token.BacktickToken &&
            scanner.token() !== backtickStringToken) {
            return undefined;
        }

        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);

        // scan the number of backticks
        const backtickCount: number = preprocessor.peekCount(0, CharacterCodes.backtick);
        preprocessor.advance(backtickCount);

        let tokenValue: string = "";
        let pos: number = preprocessor.pos;
        let codePoint: number | undefined;
        const hasLeadingSpace: boolean = preprocessor.peekIsAny(0,
            CharacterCodes.space,
            CharacterCodes.lineFeed);
        let hasTrailingSpace: boolean = false;
        let hasNonSpace: boolean = false;
        for (;;) {
            codePoint = preprocessor.peek();
            if (codePoint === undefined) {
                // unterminated
                return undefined;
            }

            if (codePoint === CharacterCodes.backtick) {
                const count: number = preprocessor.peekCount(0, CharacterCodes.backtick);
                if (count === backtickCount) {
                    break;
                }

                // consume this run of backticks so that we don't check it again.
                hasNonSpace = true;
                hasTrailingSpace = false;
                preprocessor.advance(count);
                continue;
            }

            if (codePoint === CharacterCodes.lineFeed) {
                // consume the string up to this point
                tokenValue += preprocessor.slice(pos, preprocessor.pos);

                // convert line feeds into single spaces
                tokenValue += " ";
                preprocessor.read();
                pos = preprocessor.pos;
                hasTrailingSpace = true;
                continue;
            }

            // update whether the last consumed codepoint was a space
            if (codePoint === CharacterCodes.space) {
                hasTrailingSpace = true;
            } else {
                hasTrailingSpace = false;
                hasNonSpace = true;
            }

            // consume the character
            preprocessor.read();
        }

        // consume the remainder of the string.
        tokenValue += preprocessor.slice(pos, preprocessor.pos);

        // trim the leading and trailing space character if the string contains non-space characters.
        if (hasLeadingSpace && hasTrailingSpace && hasNonSpace) {
            tokenValue = tokenValue.slice(1, -1);
        }

        preprocessor.advance(backtickCount);
        return scanner.setToken(codeSpanToken, tokenValue);
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
        // https://spec.commonmark.org/0.29/#code-spans
        const scanner: Scanner = parser.scanner;
        if (scanner.rescan(rescanBacktickString) !== backtickStringToken) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const backtickCount: number = scanner.tokenLength;
        if (scanner.rescan(rescanCodeSpan) === codeSpanToken) {
            const text: string = scanner.getTokenValue();
            const end: number = scanner.pos;
            scanner.scan();

            return new MarkdownCodeSpan({ pos, end, backtickCount, text });
        }

        const text: string = scanner.getTokenValue();
        const end: number = scanner.pos;
        scanner.scan();

        return new Run({ pos, end, text });
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: MarkdownCodeSpan): void {
        writer.writeTag('code');
        writer.write(node.text);
        writer.writeTag('/code');
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownCodeSpan): void {
        writer.write(StringUtils.repeat('`', node.backtickCount));
        if (node.text.indexOf('`') >= 0) {
            writer.write(' ');
            writer.write(node.text);
            writer.write(' ');
        } else {
            writer.write(node.text);
        }
        writer.write(StringUtils.repeat('`', node.backtickCount));
    }
}