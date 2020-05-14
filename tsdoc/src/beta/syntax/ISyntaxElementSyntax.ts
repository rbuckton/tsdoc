import { SyntaxElement } from "../nodes/SyntaxElement";
import { Scanner } from "../parser/Scanner";

export interface ISyntaxElementSyntax<T extends SyntaxElement> {
    /**
     * Attempts to parse a SyntaxElement from the current token.
     *
     * NOTE: This function should be executed inside of a call to Scanner.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param scanner The scanner used to parse the Inline.
     */
    tryParseSyntaxElement(scanner: Scanner): T | undefined;
}