import { InlineParser, IDelimiterFrame } from "../parser/InlineParser";

export interface IDelimiterProcessor {
    /**
     * Process a balanced pair of delimiters.
     * @param parser The parser used to parse the delimited Inline.
     * @param opener The opening frame for the delimiter.
     * @param closer The closing frame for the delimiter.
     * @returns The string `"not-processed"` if the delimiter could not be processed; otherwise, the new
     * closing frame (or `undefined`) if a delimiter was processed.
     */
    processDelimiter(parser: InlineParser, opener: IDelimiterFrame | undefined, closer: IDelimiterFrame): IDelimiterFrame | "not-processed" | undefined;
}
