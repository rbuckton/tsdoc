import { StartResult, ContinueResult } from "./IBlockSyntaxParser";
import { Token } from "../Token";
import { SyntaxKind } from "../nodes/SyntaxKind";
import { BlockParser } from "../BlockParser";
import { Scanner } from "../Scanner";
import { TsDocBlockTagScanner } from "../scanners/TsDocBlockTagScanner";
import { Node } from "../nodes/Node";
import { DocBlockTag } from "../nodes/DocBlockTag";
import { DocTagName } from "../nodes/DocTagName";

export namespace DocBlockTagParser {
    export const kind: SyntaxKind.DocBlockTag = SyntaxKind.DocBlockTag;

    export function tryStart(parser: BlockParser, _container: Node): StartResult {
        const scanner: Scanner = parser.scanner;
        if (parser.indent <= 3 && scanner.rescan(TsDocBlockTagScanner.rescanTsDocTagName) === Token.DocTagName) {
            const result: StartResult | undefined = scanner.speculate(/*lookAhead*/ false, () => {
                const pos: number = scanner.startPos;
                const tagNameText: string = scanner.getTokenText();
                const tagName = new DocTagName({ text: tagNameText });
                parser.setNodePos(tagName, pos, scanner.pos);
                scanner.scan();

                if (!Token.isWhitespaceCharacter(scanner.token()) &&
                    !Token.isLineEnding(scanner.token())) {
                    return undefined;
                }

                scanner.scanColumns(1);
                parser.finishUnmatchedBlocks();
                parser.pushBlock(new DocBlockTag({ tagName }), pos);
                return StartResult.Container;
            });
            if (result !== undefined) {
                return result;
            }
        }
        return StartResult.Unmatched;
    }

    export function tryContinue(parser: BlockParser, block: DocBlockTag): ContinueResult {
        const scanner: Scanner = parser.scanner;
        if (block.kind === kind && scanner.token() === Token.AtToken) {
            const result: ContinueResult | undefined = scanner.speculate(/*lookAhead*/ false, () => {
                scanner.scan();
                if (scanner.rescan(TsDocBlockTagScanner.rescanTsDocTagName) !== Token.DocTagName) {
                    return ContinueResult.Matched;
                }
                return undefined;
            });
            if (result !== undefined) {
                return result;
            }
        }
        return ContinueResult.Unmatched;
    }

    export function finish(_parser: BlockParser, _block: DocBlockTag): void {
        // DocBlockTags have no finish behavior.
    }
}
