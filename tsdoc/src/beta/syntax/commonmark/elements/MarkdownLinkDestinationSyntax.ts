import { Scanner } from "../../../parser/Scanner";
import { Token, TokenLike } from "../../../parser/Token";
import { MarkdownLinkDestination } from "../../../nodes/MarkdownLinkDestination";
import { MarkdownUtils } from "../../../utils/MarkdownUtils";
import { Preprocessor } from "../../../parser/Preprocessor";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { ISyntaxElementSyntax } from "../../ISyntaxElementSyntax";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";

export namespace MarkdownLinkDestinationSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & ISyntaxElementSyntax<MarkdownLinkDestination>
        & ITSDocEmittable<MarkdownLinkDestination>
    >(MarkdownLinkDestinationSyntax);

    // Special tokens for link destinations
    const linkDestinationToken = Symbol('LinkDestinationToken'); // <abc> or http://foo

    function isEscape(preprocessor: Preprocessor, codePoint: number): boolean {
        return codePoint === CharacterCodes.backslash &&
            preprocessor.peekIs(1, UnicodeUtils.isAsciiPunctuation);
    }

    function commit(preprocessor: Preprocessor, from: number): string {
        const segment: string = preprocessor.slice(from, preprocessor.pos);
        preprocessor.read();
        return segment;
    }

    function rescanBracketedLinkDestination(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#link-destination
        const preprocessor: Preprocessor = scanner.preprocessor;
        let start: number = preprocessor.pos;
        let tokenValue: string = "";
        for (;;) {
            const codePoint: number | undefined = preprocessor.peek();
            if (codePoint === undefined ||
                codePoint === CharacterCodes.lineFeed) {
                return undefined;
            }
            if (codePoint === CharacterCodes.greaterThan) {
                return scanner.setToken(linkDestinationToken, tokenValue + commit(preprocessor, start));
            }
            if (isEscape(preprocessor, codePoint)) {
                tokenValue += commit(preprocessor, start);
                start = preprocessor.pos;
            }
            preprocessor.read();
        }
    }

    function rescanUnbracketedLinkDestination(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#link-destination
        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);
        let start: number = preprocessor.pos;
        let tokenValue: string = "";
        let openCount: number = 0;
        let codePoint: number | undefined;
        for (;;) {
            codePoint = preprocessor.peek();
            if (codePoint === undefined ||
                codePoint === CharacterCodes.closeParen && openCount === 0 ||
                UnicodeUtils.isAsciiWhitespace(codePoint) ||
                UnicodeUtils.isControl(codePoint)) {
                if (openCount ||
                    preprocessor.pos === scanner.startPos && codePoint !== CharacterCodes.closeParen) {
                    return undefined;
                }
                tokenValue += preprocessor.slice(start, preprocessor.pos);
                return scanner.setToken(linkDestinationToken, tokenValue);
            }
            else if (isEscape(preprocessor, codePoint)) {
                tokenValue += commit(preprocessor, start);
                start = preprocessor.pos;
            }
            else if (codePoint === CharacterCodes.openParen) {
                openCount++;
            }
            else if (codePoint === CharacterCodes.closeParen) {
                openCount--;
            }
            preprocessor.read();
        }
    }

    function rescanLinkDestination(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#link-destination
        if (scanner.token() === Token.LessThanToken) {
            return rescanBracketedLinkDestination(scanner);
        } else {
            return rescanUnbracketedLinkDestination(scanner);
        }
    }

    export function tryParseSyntaxElement(scanner: Scanner): MarkdownLinkDestination | undefined {
        const token: TokenLike = scanner.token();
        if (scanner.rescan(rescanLinkDestination) !== linkDestinationToken) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        const text: string = MarkdownUtils.normalizeURL(MarkdownUtils.unescapeString(scanner.getTokenValue()));
        const bracketed: boolean = token === Token.LessThanToken;
        scanner.scan();

        return new MarkdownLinkDestination({ pos, end, text, bracketed });
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownLinkDestination): void {
        writer.write(node.text);
    }
}