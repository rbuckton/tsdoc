import { Node } from "../nodes/Node";
import { ITSDocEmittable } from "../syntax/ITSDocEmittable";
import { SyntaxKindUtils } from "../utils/SyntaxKindUtils";
import { TSDocWriter } from "./TSDocWriter";
import { TSDocConfiguration } from "../../configuration/TSDocConfiguration";

function isTSDocEmittable(syntax: unknown): syntax is ITSDocEmittable<any> {
    return syntax !== undefined
        && typeof (syntax as ITSDocEmittable<any>).emitTSDoc === 'function';
}

export class TSDocEmitter {
    private _writer: TSDocWriter;
    private _emit: (node: Node) => void = node => this.emit(node);

    constructor(configuration: TSDocConfiguration) {
        this._writer = new TSDocWriter(configuration, this._emit);
    }

    public get configuration(): TSDocConfiguration {
        return this._writer.configuration;
    }

    public emit(node: Node) {
        if (isTSDocEmittable(node.syntax)) {
            node.syntax.emitTSDoc(this._writer, node);
            return;
        }
        throw new Error(`Not supported: ${SyntaxKindUtils.formatSyntaxKind(node.kind)} (${(node.constructor as any).name})`);
    }

    public toString(): string {
        return this._writer.toString();
    }
}
