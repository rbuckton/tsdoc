import { SyntaxKind } from "./SyntaxKind";
import { SyntaxElement, ISyntaxParameters } from "./SyntaxElement";
import { ISyntaxElementSyntax } from "../syntax/ISyntaxElementSyntax";
import { DocTagNameSyntax } from "../syntax/tsdoc/elements/DocTagNameSyntax";

export interface IDocTagNameParameters extends ISyntaxParameters {
    text?: string;
}

export class DocTagName extends SyntaxElement {
    private _text: string | undefined;

    public constructor(parameters: IDocTagNameParameters = { }) {
        super(parameters);
        if (parameters.text !== undefined && !DocTagNameSyntax.isValidTagName(parameters.text)) {
            throw new Error('Invalid tag name.');
        }
        this._text = parameters.text;
    }

    /**
     * {@inheritdoc Node.kind}
     * @override
     */
    public get kind(): SyntaxKind.DocTagName {
        return SyntaxKind.DocTagName;
    }

    /**
     * {@inheritdoc Node.syntax}
     * @override
     */
    public get syntax(): ISyntaxElementSyntax<DocTagName> {
        return DocTagNameSyntax;
    }

    /**
     * Gets or sets the text of the tag name. Tag names must start with `@` followed by an ASCII letter and zero or more additional ASCII letters or decimal digits.
     */
    public get text(): string {
        return this._text || '@unknown';
    }

    public set text(value: string) {
        if (!DocTagNameSyntax.isValidTagName(value)) {
            throw new Error('Invalid tag name.');
        }
        if (this.text !== value) {
            this.beforeChange();
            this._text = value;
            this.afterChange();
        }
    }
}
