import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { ISyntaxElementSyntax } from "../../ISyntaxElementSyntax";
import { TSDocTagName } from "../../../nodes/TSDocTagName";
import { Scanner } from "../../../parser/Scanner";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { TokenLike, Token } from "../../../parser/Token";
import { Preprocessor } from "../../../parser/Preprocessor";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";

export namespace TSDocTagNameSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & ISyntaxElementSyntax<TSDocTagName>
        & ITSDocEmittable<TSDocTagName>
    >(TSDocTagNameSyntax);


    // Special tokens for DocBlock tags
    const docTagNameToken = Symbol('DocTagNameToken'); // @param, @type, etc.

    function isTsDocTagNameStart(codePoint: number | undefined): boolean {
        return UnicodeUtils.isAsciiLetter(codePoint);
    }

    function isTsDocTagNamePart(codePoint: number | undefined): boolean {
        return isTsDocTagNameStart(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint)
            || codePoint === CharacterCodes._;
    }

    function rescanTsDocTagName(scanner: Scanner): TokenLike | undefined {
        if (scanner.token() === Token.AtToken) {
            const preprocessor: Preprocessor = scanner.preprocessor;
            const count: number = preprocessor.peekCount(0, isTsDocTagNameStart, isTsDocTagNamePart);
            if (count > 0) {
                preprocessor.advance(count);
                return scanner.setToken(docTagNameToken);
            }
        }
        return undefined;
    }

    export function isValidTagName(text: string) {
        const scanner: Scanner = new Scanner(text);
        scanner.scan();
        return scanner.rescan(rescanTsDocTagName) === docTagNameToken
            && scanner.messageTail === undefined;
    }

    /**
     * Attempts to parse a SyntaxElement from the current token.
     *
     * NOTE: This function should be executed inside of a call to Scanner.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param scanner The scanner used to parse the Inline.
     */
    export function tryParseSyntaxElement(scanner: Scanner): TSDocTagName | undefined {
        if (scanner.rescan(rescanTsDocTagName) !== docTagNameToken) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const end: number = scanner.pos;
        const tagNameText: string = scanner.getTokenText();
        const tagName = new TSDocTagName({ pos, end, text: tagNameText });
        scanner.scan();
        return tagName;
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: TSDocTagName): void {
        writer.write(node.text);
    }
}