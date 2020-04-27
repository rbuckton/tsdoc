import { Block, IBlockParameters } from "./Block";
import { SyntaxKind } from "./SyntaxKind";
import { Token } from "../parser/Token";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { StringUtils } from "../parser/utils/StringUtils";
import { ContentUtils } from "./ContentUtils";
import { Inline, IInlineContainer, IInlineContainerParameters } from "./Inline";

export interface IMarkdownHeadingParameters extends IBlockParameters, IInlineContainerParameters {
    headingToken: Token.Heading;
    level: number;
}

export class MarkdownHeading extends Block implements IInlineContainer {
    private _headingToken: Token.Heading | undefined;
    private _level: number | undefined;

    public constructor(parameters?: IMarkdownHeadingParameters) {
        super(parameters);
        this._headingToken = parameters && parameters.headingToken;
        this._level = parameters && parameters.level;
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /** @override */
    public get kind(): SyntaxKind.MarkdownHeading {
        return SyntaxKind.MarkdownHeading;
    }

    public get headingToken(): Token.Heading {
        return this._headingToken || Token.AtxHeadingToken;
    }

    public set headingToken(value: Token.Heading) {
        if (!Token.isHeading(value)) throw new RangeError("Argument out of range: value");
        if (this.headingToken !== value) {
            this.beforeChange();
            this._headingToken = value;
            this.afterChange();
        }
    }

    public get level(): number {
        return this._level || 1;
    }

    public set level(value: number) {
        if (value < 1 || value > 6 || (value >>> 0) !== value) {
            throw new RangeError("Argument out of range: value");
        }
        if (this.level !== value) {
            this.beforeChange();
            this._level = value;
            this.afterChange();
        }
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
        if (this.headingToken === Token.AtxHeadingToken) {
            printer.write(StringUtils.repeat('#', this.level));
            printer.write(' ');
            this.printChildren(printer);
        } else {
            this.printChildren(printer);
            printer.write(this.headingToken === Token.MinusSetextHeadingToken ? '---' : '===');
        }
        printer.writeln();
    }
}
