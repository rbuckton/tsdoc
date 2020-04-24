import { SyntaxKind } from "./SyntaxKind";
import { DocTagName } from "./DocTagName";
import { Block, IBlockParameters } from "./Block";
import { Node } from "./Node";
import { Syntax } from "./Syntax";
import { TSDocPrinter } from "../parser/TSDocPrinter";

export interface IDocBlockTagParameters extends IBlockParameters {
    tagName?: DocTagName;
}

export class DocBlockTag extends Block {
    private _tagNameSyntax: DocTagName | undefined;

    public constructor(parameters?: IDocBlockTagParameters) {
        super(parameters);
        this.attachSyntax(this._tagNameSyntax = parameters && parameters.tagName);
    }

    /**
     * @override
     */
    public get kind(): SyntaxKind.DocBlockTag {
        return SyntaxKind.DocBlockTag;
    }

    public get tagNameSyntax(): DocTagName {
        if (!this._tagNameSyntax) {
            this.attachSyntax(this._tagNameSyntax = new DocTagName());
        }
        return this._tagNameSyntax;
    }

    public get tagName(): string {
        return this.tagNameSyntax.text;
    }

    public set tagName(value: string) {
        this.tagNameSyntax.text = value;
    }

    /**
     * @override
     */
    public isBlockContainer(): true {
        return true;
    }

    /**
     * @override
     */
    public canHaveParent(node: Node): boolean {
        return node.isDocument();
    }

    /**
     * @override
     */
    public getSyntax(): ReadonlyArray<Syntax> {
        const syntax: Syntax[] = [];
        if (this._tagNameSyntax) syntax.push(this._tagNameSyntax);
        return syntax;
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        throw new Error("Not yet implemented");
    }
}
