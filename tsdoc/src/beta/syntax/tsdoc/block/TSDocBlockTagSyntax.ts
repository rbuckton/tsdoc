import { Token } from "../../../parser/Token";
import { BlockParser } from "../../../parser/BlockParser";
import { Scanner } from "../../../parser/Scanner";
import { TSDocBlockTag } from "../../../nodes/TSDocBlockTag";
import { TSDocTagName } from "../../../nodes/TSDocTagName";
import { Block } from "../../../nodes/Block";
import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IBlockSyntax } from "../../IBlockSyntax";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { TSDocTagNameSyntax } from "../elements/TSDocTagNameSyntax";
import { TSDocModifierTag } from "../../../nodes/TSDocModifierTag";
import { TSDocParamTag } from "../../../nodes/TSDocParamTag";
import { SyntaxKind } from "../../../nodes/SyntaxKind";
import { TSDocTagDefinition, TSDocTagSyntaxKind } from "../../../../configuration/TSDocTagDefinition";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";
import { StandardTags } from "../../../../details/StandardTags";

export namespace TSDocBlockTagSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IBlockSyntax<TSDocBlockTag | TSDocModifierTag | TSDocParamTag>
        & IHtmlEmittable<TSDocBlockTag | TSDocModifierTag | TSDocParamTag>
        & ITSDocEmittable<TSDocBlockTag | TSDocModifierTag | TSDocParamTag>
    >(TSDocBlockTagSyntax);

    /**
     * Attempts to start a new Block syntax at the current token.
     *
     * NOTE: This function should be executed inside of a call to BlockParser.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param parser The parser used to parse the Block.
     * @param container The containing Block for the current token.
     * @returns A new Block if the block was started; otherwise, `undefined`.
     */
    export function tryStartBlock(parser: BlockParser, container: Block): Block | undefined {
        const scanner: Scanner = parser.scanner;
        if (parser.indented) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const tagName: TSDocTagName | undefined = scanner.tryParse(TSDocTagNameSyntax.tryParseSyntaxElement);
        if (!tagName) {
            return undefined;
        }

        if (StandardTags.param.tagNameWithUpperCase === tagName.text.toUpperCase() ||
            StandardTags.typeParam.tagNameWithUpperCase === tagName.text.toUpperCase()) {
            scanner.scanWhitespace();
            const pos: number = scanner.startPos;
            while (!Token.isWhitespaceCharacter(scanner.token())
                && !Token.isPunctuationCharacter(scanner.token())
                && scanner.token() !== Token.EndOfFileToken) {
                scanner.scan();
            }

            const parameterName: string = scanner.slice(pos, scanner.startPos).trim();
            if (Token.isWhitespaceCharacter(scanner.token())) {
                scanner.scanColumns(1);
            }

            const node: TSDocParamTag = new TSDocParamTag({ pos, tagName, parameterName });
            parser.pushBlock(container, node);
            return node;
        }

        const tagDefinition: TSDocTagDefinition | undefined = parser.configuration.tryGetTagDefinitionWithUpperCase(tagName.text.toUpperCase());

        // Parse it as a modifier if its known to be a modifier
        if (tagDefinition && tagDefinition.syntaxKind === TSDocTagSyntaxKind.ModifierTag) {
            const node: TSDocModifierTag = new TSDocModifierTag({ pos, tagName });
            parser.pushBlock(container, node);
            return node;
        }

        // Parse it as a block if its unknown or definitely a block
        if (!tagDefinition || tagDefinition.syntaxKind === TSDocTagSyntaxKind.BlockTag) {
            if (!Token.isWhitespaceCharacter(scanner.token()) &&
                !Token.isLineEnding(scanner.token())) {
                return undefined;
            }

            if (!Token.isLineEnding(scanner.token())) {
                scanner.scanColumns(1);
            }

            const node: TSDocBlockTag = new TSDocBlockTag({ pos, tagName });
            parser.pushBlock(container, node);
            return node;
        }

        return undefined;
    }

    /**
     * Attempts to continue an existing Block syntax on a subsequent line.
     *
     * NOTE: This function should be executed inside of a call to BlockParser.tryParse as it does
     * not save or restore scanner state on its own.
     *
     * @param parser The parser used to parse the Block.
     * @param block The Block to continue.
     * @returns `true` if the Block was continued; otherwise, `false`.
     */
    export function tryContinueBlock(parser: BlockParser, block: TSDocBlockTag | TSDocModifierTag | TSDocParamTag): boolean {
        return block.kind === SyntaxKind.TSDocBlockTag
            || block.kind === SyntaxKind.TSDocParamTag;
    }

    /**
     * Finishes the current block, performing any necessary block-level post-processing.
     * @param parser The parser used to parse the Block.
     * @param block The Block to finish.
     */
    export function finishBlock(parser: BlockParser, block: TSDocBlockTag | TSDocModifierTag | TSDocParamTag): void {
        // DocBlockTags have no finish behavior.
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: TSDocBlockTag | TSDocModifierTag | TSDocParamTag): void {
        writer.write(node.tagName);
        if (node.kind === SyntaxKind.TSDocParamTag ||
            node.kind === SyntaxKind.TSDocBlockTag) {
            writer.writeRaw(' &mdash;');
        }
        if (node.kind === SyntaxKind.TSDocParamTag) {
            writer.write(' ');
            writer.write(node.parameterName);
        }
        if (node.kind === SyntaxKind.TSDocParamTag ||
            node.kind === SyntaxKind.TSDocBlockTag) {
            writer.writeContents(node);
        }
        writer.writeLine();
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: TSDocBlockTag | TSDocModifierTag | TSDocParamTag): void {
        writer.write(node.tagName);
        if (node.kind === SyntaxKind.TSDocParamTag) {
            writer.write(' ');
            writer.write(node.parameterName);
            writer.write(' ');
        }
        if (node.kind === SyntaxKind.TSDocParamTag ||
            node.kind === SyntaxKind.TSDocBlockTag) {
            writer.writeContents(node);
        }
        writer.writeln();
    }
}
