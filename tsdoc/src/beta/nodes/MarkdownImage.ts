import { SyntaxKind } from "./SyntaxKind";
import { LinkBase, ILinkBaseParameters } from "./LinkBase";
import { IInlineSyntax } from "../syntax/IInlineSyntax";
import { MarkdownLinkSyntax } from "../syntax/commonmark/inline/MarkdownLinkSyntax";

export interface IMarkdownImageParameters extends ILinkBaseParameters {
}

export class MarkdownImage extends LinkBase {
    public constructor(parameters: IMarkdownImageParameters = {}) {
        if (parameters.destination !== undefined && parameters.label !== undefined) {
            throw new Error('An image cannot specify both a destination and a label');
        }
        if (parameters.title !== undefined && parameters.label !== undefined) {
            throw new Error('An image cannot specify both a title and a label');
        }
        super(parameters);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownImage {
        return SyntaxKind.MarkdownImage;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IInlineSyntax {
        return MarkdownLinkSyntax;
    }
}