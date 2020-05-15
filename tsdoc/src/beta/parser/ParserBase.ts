import { Node } from "../nodes/Node";
import { Scanner } from "./Scanner";
import { LineMap } from "./LineMap";
import { IMap } from "./Mapper";
import { TSDocMessageId } from "../../parser/TSDocMessageId";
import { TSDocConfiguration } from "../../configuration/TSDocConfiguration";
import { Document } from "../nodes/Document";
import { ParserMessageLog } from "./ParserMessageLog";

export abstract class ParserBase {
    private _scanner: Scanner;
    private _lineMap: LineMap | undefined;
    private _parserState = new Map<unknown, Map<Node, unknown>>();

    public constructor(text: string, map?: IMap, log?: ParserMessageLog) {
        this._scanner = new Scanner(text, map, log);
    }

    public abstract get document(): Document;
    public abstract get configuration(): TSDocConfiguration;

    public get scanner(): Scanner {
        return this._scanner;
    }

    public get text(): string {
        return this._scanner.text;
    }

    public get rawText(): string {
        return this._scanner.rawText;
    }

    public get lineMap(): LineMap {
        if (!this._lineMap) {
            this._lineMap = new LineMap(this.text);
        }
        return this._lineMap;
    }

    public getState<K, TNode extends Node, U>(key: K, node: TNode, createState: (node: TNode, key: K) => U) {
        let nodeMap: Map<Node, unknown> | undefined = this._parserState.get(key);
        if (nodeMap === undefined) this._parserState.set(key, nodeMap = new Map());
        let nodeState: unknown = nodeMap.get(node);
        if (nodeState === undefined) nodeMap.set(node, nodeState = createState(node, key));
        return nodeState as U;
    }

    public reportError(messageId: TSDocMessageId, messageText: string, pos?: number, end?: number): void {
        this._scanner.reportError(messageId, messageText, pos, end);
    }
}