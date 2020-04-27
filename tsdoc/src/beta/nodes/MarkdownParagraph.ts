import { SyntaxKind } from "./SyntaxKind";
import { Block, IBlockParameters } from "./Block";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { ContentUtils } from "./ContentUtils";
import { Inline, IInlineContainer, IInlineContainerParameters } from "./Inline";

export interface IMarkdownParagraphParameters extends IBlockParameters, IInlineContainerParameters {
}

export class MarkdownParagraph extends Block implements IInlineContainer {
    public constructor(parameters?: IMarkdownParagraphParameters) {
        super(parameters);
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownParagraph {
        return SyntaxKind.MarkdownParagraph;
    }

    /**
     * Gets the first child of this node, if that child is an `Inline`.
     */
    public get firstChildInline(): Inline | undefined {
        return this.firstChild && this.firstChild.isInline() ? this.firstChild : undefined;
    }

    /**
     * Gets the last child of this node, if that child is an `Inline`.
     */
    public get lastChildInline(): Inline | undefined {
        return this.lastChild && this.lastChild.isInline() ? this.lastChild : undefined;
    }

    /** @override */
    public isInlineContainer(): true {
        return true;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        this.printChildren(printer);
        printer.writeln();
    }
}