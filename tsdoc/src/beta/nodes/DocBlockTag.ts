import { SyntaxKind } from "./SyntaxKind";
import { DocTagName } from "./DocTagName";
import { Block, IBlockParameters, IBlockContainer, IBlockContainerParameters } from "./Block";
import { Node } from "./Node";
import { Syntax } from "./Syntax";
import { TSDocPrinter } from "../parser/TSDocPrinter";
import { ContentUtils } from "./ContentUtils";

export interface IDocBlockTagParameters extends IBlockParameters, IBlockContainerParameters {
    tagName?: DocTagName | string;
}

export class DocBlockTag extends Block implements IBlockContainer {
    private _tagNameSyntax: DocTagName;

    public constructor(parameters: IDocBlockTagParameters = {}) {
        super(parameters);
        this.attachSyntax(this._tagNameSyntax =
            parameters.tagName instanceof DocTagName ? parameters.tagName :
            new DocTagName({ text: parameters.tagName }));
        ContentUtils.appendContent(this, parameters && parameters.content);
    }

    /**
     * @override
     */
    public get kind(): SyntaxKind.DocBlockTag {
        return SyntaxKind.DocBlockTag;
    }

    public get tagName(): string {
        return this._tagNameSyntax.text;
    }

    public set tagName(value: string) {
        this._tagNameSyntax.text = value;
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
        return [this._tagNameSyntax];
    }

    /** @override */
    protected print(printer: TSDocPrinter): void {
        throw new Error("Not yet implemented");
    }
}
