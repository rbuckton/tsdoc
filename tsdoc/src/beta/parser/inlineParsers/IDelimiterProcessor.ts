import { InlineParser, IDelimiterFrame } from "../InlineParser";

export interface IDelimiterProcessor {
    processDelimiter(parser: InlineParser, opener: IDelimiterFrame | undefined, closer: IDelimiterFrame): IDelimiterFrame | "not-processed" | undefined;
}