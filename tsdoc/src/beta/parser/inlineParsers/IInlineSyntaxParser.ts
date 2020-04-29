import { Inline, IInlineContainer } from "../../nodes/Inline";
import { InlineParser } from "../InlineParser";

export interface IInlineSyntaxParser<T extends Inline> {
    tryParse(parser: InlineParser, parent: IInlineContainer): T | undefined;
}
