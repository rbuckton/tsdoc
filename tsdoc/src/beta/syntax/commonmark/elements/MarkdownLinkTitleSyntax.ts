import { Token, TokenLike } from "../../../parser/Token";
import { Scanner, IRescanStringOptions } from "../../../parser/Scanner";
import { MarkdownLinkTitle, MarkdownLinkTitleQuoteStyle } from "../../../nodes/MarkdownLinkTitle";
import { MarkdownUtils } from "../../../utils/MarkdownUtils";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { ISyntaxElementSyntax } from "../../ISyntaxElementSyntax";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";

export namespace MarkdownLinkTitleSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & ISyntaxElementSyntax<MarkdownLinkTitle>
        & ITSDocEmittable<MarkdownLinkTitle>
    >(MarkdownLinkTitleSyntax);

    // Special tokens for link titles
    const linkTitleToken = Symbol('LinkTitleToken'); // "abc" or 'abc' or (abc)

    const doubleQuotedLinkTitleOptions: IRescanStringOptions = {
        token: linkTitleToken,
        openQuote: CharacterCodes.quoteMark,
        closeQuote: CharacterCodes.quoteMark,
        noBlankLines: true
    };

    const singleQuotedLinkTitleOptions: IRescanStringOptions = {
        token: linkTitleToken,
        openQuote: CharacterCodes.apostrophe,
        closeQuote: CharacterCodes.apostrophe,
        noBlankLines: true
    };

    const parenthesizedLinkTitleOptions: IRescanStringOptions = {
        token: linkTitleToken,
        openQuote: CharacterCodes.openParen,
        closeQuote: CharacterCodes.closeParen,
        noBlankLines: true
    };

    function rescanLinkTitle(scanner: Scanner): TokenLike | undefined {
        // https://spec.commonmark.org/0.29/#link-title
        switch (scanner.token()) {
            case Token.QuoteMarkToken: return scanner.rescan(Scanner.rescanString, doubleQuotedLinkTitleOptions);
            case Token.ApostropheToken: return scanner.rescan(Scanner.rescanString, singleQuotedLinkTitleOptions);
            case Token.OpenParenToken: return scanner.rescan(Scanner.rescanString, parenthesizedLinkTitleOptions);
            default: return undefined;
        }
    }

    export function tryParseSyntaxElement(scanner: Scanner): MarkdownLinkTitle | undefined {
        const token: TokenLike = scanner.token();
        if (scanner.rescan(rescanLinkTitle) !== linkTitleToken) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        const text: string = MarkdownUtils.unescapeString(scanner.getTokenValue());
        const quoteStyle: MarkdownLinkTitleQuoteStyle =
            token === Token.ApostropheToken ? MarkdownLinkTitleQuoteStyle.SingleQuote :
            token === Token.OpenParenToken ? MarkdownLinkTitleQuoteStyle.Parenthesized :
            MarkdownLinkTitleQuoteStyle.DoubleQuote;

        scanner.scan();

        return new MarkdownLinkTitle({ pos, end, text, quoteStyle });
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: MarkdownLinkTitle): void {
        writer.write(' ');
        writer.write(
            node.quoteStyle === MarkdownLinkTitleQuoteStyle.DoubleQuote ? '"' :
            node.quoteStyle === MarkdownLinkTitleQuoteStyle.SingleQuote ? '\'' :
            '(');
        writer.write(node.text);
        writer.write(
            node.quoteStyle === MarkdownLinkTitleQuoteStyle.DoubleQuote ? '"' :
            node.quoteStyle === MarkdownLinkTitleQuoteStyle.SingleQuote ? '\'' :
            ')');
    }
}