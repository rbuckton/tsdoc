import { SyntaxKind } from "./SyntaxKind";
import { SyntaxElement, ISyntaxParameters } from "./SyntaxElement";
import { ISyntaxElementSyntax } from "../syntax/ISyntaxElementSyntax";
import { MarkdownLinkDestinationSyntax } from "../syntax/commonmark/elements/MarkdownLinkDestinationSyntax";

export interface IMarkdownLinkDestinationParameters extends ISyntaxParameters {
    text?: string;
    bracketed?: boolean;
}

export class MarkdownLinkDestination extends SyntaxElement {
    private _text: string | undefined;
    private _bracketed: boolean | undefined;

    public constructor(parameters?: IMarkdownLinkDestinationParameters) {
        super(parameters);
        this._text = parameters && parameters.text;
        this._bracketed = parameters && parameters.bracketed;
    }

    /**
     * {@inheritDoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.MarkdownLinkDestination {
        return SyntaxKind.MarkdownLinkDestination;
    }

    /**
     * {@inheritDoc Node.syntax}
     * @override
     */
    public get syntax(): ISyntaxElementSyntax<MarkdownLinkDestination> {
        return MarkdownLinkDestinationSyntax;
    }

    /**
     * Gets or sets the text of the destination.
     */
    public get text(): string {
        return this._text || '';
    }

    public set text(value: string) {
        // TODO: validate that value is a valid destination?
        if (this.text !== value) {
            this.beforeChange();
            this._text = value;
            this.afterChange();
        }
    }

    /**
     * Gets or sets the TSDoc/markdown style for the destination.
     */
    public get bracketed(): boolean {
        return this._bracketed || false;
    }

    public set bracketed(value: boolean) {
        if (this.bracketed !== value) {
            this.beforeChange();
            this._bracketed = value;
            this.afterChange();
        }
    }
}
