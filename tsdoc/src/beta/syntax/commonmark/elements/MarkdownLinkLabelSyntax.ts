import { Token, TokenLike } from "../../../parser/Token";
import { Scanner } from "../../../parser/Scanner";
import { MarkdownLinkLabel } from "../../../nodes/MarkdownLinkLabel";
import { Preprocessor } from "../../../parser/Preprocessor";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { ISyntaxElementSyntax } from "../../ISyntaxElementSyntax";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";

export namespace MarkdownLinkLabelSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & ISyntaxElementSyntax<MarkdownLinkLabel>
        & ITSDocEmittable<MarkdownLinkLabel>
    >(MarkdownLinkLabelSyntax);

    // Special tokens for link labels
    const linkLabelToken = Symbol("LinkLabelToken");    // [abc]

    function isEscape(preprocessor: Preprocessor, codePoint: number): boolean {
        return codePoint === CharacterCodes.backslash &&
            preprocessor.peekIs(1, UnicodeUtils.isAsciiPunctuation);
    }

    function commit(preprocessor: Preprocessor, from: number): string {
        const segment: string = preprocessor.slice(from, preprocessor.pos);
        preprocessor.read();
        return segment;
    }

    function rescanLinkLabel(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#link-label
        if (scanner.token() !== Token.OpenBracketToken) return undefined;
        const preprocessor: Preprocessor = scanner.preprocessor;
        const start: number = preprocessor.pos;
        for (;;) {
            const codePoint: number | undefined = preprocessor.peek();
            if (codePoint === undefined ||
                codePoint === CharacterCodes.openBracket ||
                codePoint !== CharacterCodes.closeBracket && preprocessor.pos - start > 999) {
                return undefined;
            }
            if (codePoint === CharacterCodes.closeBracket) {
                return scanner.setToken(linkLabelToken, commit(preprocessor, start));
            }
            if (isEscape(preprocessor, codePoint)) {
                preprocessor.read();
            }
            preprocessor.read();
        }
    }

    export function tryParseSyntaxElement(scanner: Scanner): MarkdownLinkLabel | undefined {
        if (scanner.rescan(rescanLinkLabel) !== linkLabelToken) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        const text: string = scanner.getTokenValue();
        scanner.scan();

        return new MarkdownLinkLabel({ pos, end, text });
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownLinkLabel): void {
        writer.write('[');
        writer.write(node.text);
        writer.write(']');
    }
}