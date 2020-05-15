import { Token, TokenLike } from "../../../parser/Token";
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
import { TSDocMessageId } from "../../../../parser/TSDocMessageId";
import { Preprocessor } from "../../../parser/Preprocessor";
import { UnicodeUtils } from "../../../utils/UnicodeUtils";
import { CharacterCodes } from "../../../parser/CharacterCodes";
import { StringChecks } from "../../../../parser/StringChecks";

export namespace TSDocBlockTagSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IBlockSyntax<TSDocBlockTag | TSDocModifierTag | TSDocParamTag>
        & IHtmlEmittable<TSDocBlockTag | TSDocModifierTag | TSDocParamTag>
        & ITSDocEmittable<TSDocBlockTag | TSDocModifierTag | TSDocParamTag>
    >(TSDocBlockTagSyntax);

    interface IUnsupportedFragment {
        text: string;
        pos: number;
        end: number;
    }

    const parameterNameToken = Symbol('ParameterNameToken');

    function isParameterNameStart(codePoint: number | undefined): boolean {
        return UnicodeUtils.isAsciiLetter(codePoint)
            || codePoint === CharacterCodes._
            || codePoint === CharacterCodes.$;
    }

    function isParameterNamePart(codePoint: number | undefined): boolean {
        return isParameterNameStart(codePoint)
            || UnicodeUtils.isDecimalDigit(codePoint)
            || codePoint === CharacterCodes.dot;
    }

    function rescanParameterNameToken(scanner: Scanner): TokenLike | undefined {
        const preprocessor: Preprocessor = scanner.preprocessor;
        preprocessor.setPos(scanner.startPos);
        const count: number = preprocessor.peekCount(0, isParameterNameStart, isParameterNamePart);
        if (count === 0) {
            return undefined;
        }
        preprocessor.advance(count);
        return scanner.setToken(parameterNameToken);
    }

    function tryParseUnsupportedJSDocTypeOrValueRest(scanner: Scanner, openToken: Token, closeToken: Token): IUnsupportedFragment | undefined {
        const pos: number = scanner.startPos;
        scanner.scan();
        let quoteToken: TokenLike | undefined;
        let openCount: number = 1;
        while (openCount > 0) {
            switch (scanner.token()) {
                case openToken:
                    // ignore open bracket/brace inside of quoted string
                    if (quoteToken === undefined) openCount++;
                    break;
                case closeToken:
                    // ignore close bracket/brace inside of quoted string
                    if (quoteToken === undefined) openCount--;
                    break;
                case Token.BackslashToken:
                    // ignore backslash outside of quoted string
                    if (quoteToken !== undefined) {
                        // skip the backslash.
                        scanner.scan();
                    }
                    break;
                case Token.QuoteMarkToken:
                case Token.ApostropheToken:
                case Token.BacktickToken:
                    if (quoteToken === scanner.token()) {
                        // exit quoted string if quote character matches.
                        quoteToken = undefined;
                    } else if (quoteToken === undefined) {
                        // start quoted string if not already in one
                        quoteToken = scanner.token();
                    }
                    break;
            }
            // give up at end of input and backtrack to start
            if (scanner.token() === Token.EndOfFileToken) {
                return undefined;
            }
            scanner.scan();
        }
        const end: number = scanner.pos;
        return {
            text: scanner.slice(pos, end),
            pos,
            end
        };
    }

    function lookAheadHasFollowingAtToken(scanner: Scanner): boolean {
        return scanner.scan() === Token.AtToken;
    }

    function tryParseUnsupportedJSDocType(scanner: Scanner, tagName: string): IUnsupportedFragment | undefined {
        // do not parse `{@...` as a JSDoc type
        if (scanner.token() !== Token.OpenBraceToken ||
            scanner.lookAhead(lookAheadHasFollowingAtToken)) {
            return undefined;
        }

        const fragment: IUnsupportedFragment | undefined = tryParseUnsupportedJSDocTypeOrValueRest(scanner, Token.OpenBraceToken, Token.CloseBraceToken);
        if (fragment !== undefined) {
            scanner.reportError(
                TSDocMessageId.ParamTagWithInvalidType,
                `The ${tagName} block should not include a JSDoc-style '{type}'`,
                fragment.pos,
                fragment.end
            );
            scanner.scanWhitespace();
            return fragment;
        }
        return undefined;
    }

    function tryParseJSDocOptionalNameRest(scanner: Scanner, bracketPos: number, tagName: string): IUnsupportedFragment | undefined {
        if (scanner.token() !== Token.EndOfFileToken) {
            const fragment: IUnsupportedFragment | undefined = tryParseUnsupportedJSDocTypeOrValueRest(scanner, Token.OpenBracketToken, Token.CloseBracketToken);
            scanner.reportError(
                TSDocMessageId.ParamTagWithInvalidOptionalName,
                'The ' + tagName + ' block should not include a JSDoc-style optional name; it must not be enclosed in \'[ ]\' brackets.',
                bracketPos
            );
            if (fragment) {
                scanner.scanWhitespace();
            }
            return fragment;
        }
        return undefined;
    }

    function parseParamBlockRest(parser: BlockParser, container: Block, pos: number, tagName: TSDocTagName) {
        const scanner: Scanner = parser.scanner;
        scanner.scanWhitespace();

        // Skip past unsupported JSDoc type: '@param {type} paramName'
        scanner.tryParse(tryParseUnsupportedJSDocType, tagName.text);

        // Skip past unsupported JSDoc optional parameter bracket: '@param [paramName]'
        const bracketPos: number = scanner.startPos;
        const hasBracket: boolean = scanner.expect(Token.OpenBracketToken);
        if (hasBracket) {
            scanner.scanWhitespace();
        }

        const parameterName: string | undefined =
            scanner.rescan(rescanParameterNameToken) === parameterNameToken ?
                scanner.getTokenText() :
                undefined;
        if (parameterName === undefined) {
            scanner.reportError(
                TSDocMessageId.ParamTagWithInvalidName,
                'The ' + tagName.text + ' block should be followed by a parameter name'
            );
        } else {
            const explanation: string | undefined = StringChecks.explainIfInvalidUnquotedIdentifier(parameterName);
            if (explanation !== undefined) {
                scanner.reportError(
                    TSDocMessageId.ParamTagWithInvalidName,
                    'The ' + tagName.text + ' block should be followed by a valid parameter name: ' + explanation
                );
            }
            scanner.scan();
            scanner.scanWhitespace();
        }

        // Skip past unsupported JSDoc optional parameter default and end bracket: '@param [paramName]'
        if (hasBracket) {
            scanner.tryParse(tryParseJSDocOptionalNameRest, bracketPos, tagName.text);
        }

        // Skip past unsupported JSDoc type: '@param paramName {type}'
        scanner.tryParse(tryParseUnsupportedJSDocType, tagName.text);

        if (scanner.expect(Token.MinusToken)) {
            scanner.scanWhitespace();
        } else {
            scanner.reportError(
                TSDocMessageId.ParamTagMissingHyphen,
                'The ' + tagName.text + ' block should be followed by a parameter name and then a hyphen',
            );
        }

        // Skip past unsupported JSDoc type: '@param paramName - {type}'
        scanner.tryParse(tryParseUnsupportedJSDocType, tagName.text);

        const node: TSDocParamTag = new TSDocParamTag({ pos, tagName, parameterName });
        parser.pushBlock(container, node);
        return node;
    }

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
        if (parser.indented || scanner.token() !== Token.AtToken) {
            return undefined;
        }

        const pos: number = scanner.startPos;
        const tagName: TSDocTagName | undefined = scanner.tryParse(TSDocTagNameSyntax.tryParseSyntaxElement);
        if (!tagName) {
            scanner.reportError(
                TSDocMessageId.AtSignWithoutTagName,
                'Expecting a TSDoc tag name after "@"; if it is not a tag, use a backslash to escape this character'
            );
            return undefined;
        }

        // Parse as a @param/@typeParam tag if its a match.
        if (StandardTags.param.tagNameWithUpperCase === tagName.text.toUpperCase() ||
            StandardTags.typeParam.tagNameWithUpperCase === tagName.text.toUpperCase()) {
            return parseParamBlockRest(parser, container, pos, tagName);
        }

        // TODO: parse '@inheritDoc'

        // Parse it as a modifier if it's known to be a modifier
        const tagDefinition: TSDocTagDefinition | undefined = parser.configuration.tryGetTagDefinitionWithUpperCase(tagName.text.toUpperCase());
        if (tagDefinition && tagDefinition.syntaxKind === TSDocTagSyntaxKind.ModifierTag) {
            const node: TSDocModifierTag = new TSDocModifierTag({ pos, tagName });
            parser.pushBlock(container, node);
            return node;
        }

        // Parse it as a block if it's unknown or definitely a block
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
        const tagDefinition: TSDocTagDefinition | undefined = writer.configuration.tryGetTagDefinition(node.tagName);
        const tagName: string = tagDefinition ? tagDefinition.tagName : node.tagName;
        writer.writeTag('div', [['data-tagname', tagName]]);
        writer.writeTag('em');
        writer.write(node.tagName);
        writer.writeTag('/em');
        if (node.kind === SyntaxKind.TSDocParamTag ||
            node.kind === SyntaxKind.TSDocBlockTag) {
            writer.writeRaw(' &mdash;');
        }
        if (node.kind === SyntaxKind.TSDocParamTag) {
            writer.write(' ');
            writer.writeTag('code');
            writer.write(node.parameterName);
            writer.writeTag('/code');
            writer.writeRaw(' &mdash;');
        }
        if (node.kind === SyntaxKind.TSDocParamTag ||
            node.kind === SyntaxKind.TSDocBlockTag) {
            writer.writeContents(node);
        }
        writer.writeTag('/div');
        writer.writeLine();
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: TSDocBlockTag | TSDocModifierTag | TSDocParamTag): void {
        const tagDefinition: TSDocTagDefinition | undefined = writer.configuration.tryGetTagDefinition(node.tagName);
        const tagName: string = tagDefinition ? tagDefinition.tagName : node.tagName;
        writer.write(tagName);
        if (node.kind === SyntaxKind.TSDocParamTag) {
            writer.write(' ');
            writer.write(node.parameterName);
            writer.write(' - ');
        }
        if (node.kind === SyntaxKind.TSDocParamTag ||
            node.kind === SyntaxKind.TSDocBlockTag) {
            writer.writeContents(node);
        }
        writer.writeLine();
    }
}
