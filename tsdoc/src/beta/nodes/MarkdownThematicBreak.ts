import { INodeParameters } from "./Node";
import { Token } from "../parser/Token";
import { Block } from "./Block";
import { SyntaxKind } from "./SyntaxKind";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IMarkdownThematicBreakParameters extends INodeParameters {
    breakToken: Token.ThematicBreak;
}

export class MarkdownThematicBreak extends Block {
    public readonly parent: Block | undefined;
    public readonly previousSibling: Block | undefined;
    public readonly nextSibling: Block | undefined;
    public readonly firstChild: undefined;
    public readonly lastChild: undefined;

    private _breakToken: Token.ThematicBreak;

    public constructor(parameters: IMarkdownThematicBreakParameters) {
        super(parameters);
        this._breakToken = parameters.breakToken;
    }

    public get kind(): SyntaxKind.MarkdownThematicBreak {
        return SyntaxKind.MarkdownThematicBreak;
    }
    
    public get breakToken(): Token.ThematicBreak {
        return this._breakToken;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        printer.write(
            this._breakToken === Token.AsteriskThematicBreakToken ? '***' :
            this._breakToken === Token.MinusThematicBreakToken ? '---' :
            '___');
        printer.writeln();
    }
}
