import { SyntaxKind } from "./SyntaxKind";
import { Syntax, ISyntaxParameters } from "./Syntax";

export interface IDocTagNameParameters extends ISyntaxParameters {
    text?: string;
}

export class DocTagName extends Syntax {
    private _text: string | undefined;

    public constructor(parameters?: IDocTagNameParameters) {
        super(parameters);
        this._text = parameters && parameters.text;
    }

    /**
     * @override
     */
    public get kind(): SyntaxKind.DocTagName {
        return SyntaxKind.DocTagName;
    }

    public get text(): string {
        return this._text || "@unknown";
    }

    public set text(value: string) {
        if (this.text !== value) {
            this.beforeChange();
            this._text = value;
            this.afterChange();
        }
    }
}
