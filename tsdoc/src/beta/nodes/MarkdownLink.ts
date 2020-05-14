import { SyntaxKind } from "./SyntaxKind";
import { LinkBase, ILinkBaseParameters } from "./LinkBase";
import { IInlineSyntax } from "../syntax/IInlineSyntax";
import { MarkdownLinkSyntax } from "../syntax/commonmark/inline/MarkdownLinkSyntax";

export interface IMarkdownLinkParameters extends ILinkBaseParameters {
}

export class MarkdownLink extends LinkBase {
    public constructor(parameters: IMarkdownLinkParameters = {}) {
        if (parameters.destination !== undefined && parameters.label !== undefined) {
            throw new Error('A link cannot specify both a destination and a label');
        }
        if (parameters.title !== undefined && parameters.label !== undefined) {
            throw new Error('A link cannot specify both a title and a label');
        }
        super(parameters);
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownLink {
        return SyntaxKind.MarkdownLink;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): IInlineSyntax {
        return MarkdownLinkSyntax;
    }
}
