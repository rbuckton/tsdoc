import { StartResult, ContinueResult } from "./IBlockSyntaxParser";
import { BlockParser } from "../BlockParser";
import { SyntaxKind } from "../nodes/SyntaxKind";
import { Node } from "../nodes/Node";
import { Document } from "../nodes/Document";

export namespace DocumentParser {
    export const kind: SyntaxKind.Document = SyntaxKind.Document;

    export function tryStart(_parser: BlockParser, _container: Node): StartResult {
        // Documents cannot be started.
        return StartResult.Unmatched;
    }

    export function tryContinue(_parser: BlockParser, _block: Document): ContinueResult {
        // Documents are always continued.
        return ContinueResult.Matched;
    }

    export function finish(_parser: BlockParser, _block: Document): void {
        // Documents have no finish behavior.
    }
}
