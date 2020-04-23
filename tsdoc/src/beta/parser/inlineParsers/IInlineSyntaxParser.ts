import { Inline } from "../../nodes/Inline";
import { InlineParser } from "../InlineParser";

export interface IInlineSyntaxParser<T extends Inline> {
    tryParse(parser: InlineParser): T | undefined;
}
