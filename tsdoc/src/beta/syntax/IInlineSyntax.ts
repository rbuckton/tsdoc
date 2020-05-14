import { Inline } from "../nodes/Inline";
import { InlineParser } from "../parser/InlineParser";
import { IInlineContainer } from "../nodes/mixins/InlineContainerMixin";

export interface IInlineSyntax {
    /**
     * Attempts to parse an Inline from the current token.
     *
     * NOTE: This function should be executed inside of a call to BlockParser.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param parser The parser used to parse the Inline.
     * @param container The container for the Inline.
     */
    tryParseInline(parser: InlineParser, container: IInlineContainer): Inline | undefined;
}
