import { Node } from "../nodes/Node";
import { IHtmlEmittable } from "../syntax/IHtmlEmittable";
import { HtmlWriter } from "./HtmlWriter";
import { SyntaxKindUtils } from "../utils/SyntaxKindUtils";
import { TSDocConfiguration } from "../../configuration/TSDocConfiguration";

function isHtmlEmittable(syntax: unknown): syntax is IHtmlEmittable<any> {
    return syntax !== undefined
        && typeof (syntax as IHtmlEmittable<any>).emitHtml === 'function';
}

export class HtmlEmitter {
    private _writer: HtmlWriter;
    private _emit: (node: Node) => void = node => this.emit(node);

    constructor(configuration: TSDocConfiguration, tagFilter?: (tagName: string) => boolean) {
        this._writer = new HtmlWriter(configuration, this._emit, tagFilter);
    }

    public get configuration(): TSDocConfiguration {
        return this._writer.configuration;
    }

    public emit(node: Node) {
        if (isHtmlEmittable(node.syntax)) {
            node.syntax.emitHtml(this._writer, node);
            return;
        }
        throw new Error(`Not supported: ${SyntaxKindUtils.formatSyntaxKind(node.kind)} (${(node.constructor as any).name})`);
    }

    public toString(): string {
        return this._writer.toString();
    }
}
