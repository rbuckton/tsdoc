import { Block, IBlockParameters } from "./Block";
import { SyntaxKind } from "./SyntaxKind";
import { Token } from "../Token";
import { TSDocPrinter } from "../TSDocPrinter";
import { StringUtils } from "../utils/StringUtils";

export interface IMarkdownHeadingParameters extends IBlockParameters {
    headingToken: Token.Heading;
    level: number;
}

export class MarkdownHeading extends Block {
    private _headingToken: Token.Heading | undefined;
    private _level: number | undefined;

    public constructor(parameters?: IMarkdownHeadingParameters) {
        super(parameters);
        this._headingToken = parameters && parameters.headingToken;
        this._level = parameters && parameters.level;
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
