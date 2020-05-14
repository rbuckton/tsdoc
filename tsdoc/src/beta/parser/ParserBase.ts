import { Node } from "../nodes/Node";
import { Scanner } from "./Scanner";
import { LineMap } from "./LineMap";
import { IMapping } from "./Mapper";

export abstract class ParserBase {
    private _scanner: Scanner;
    private _lineMap: LineMap | undefined;
    private _parserState = new Map<unknown, Map<Node, unknown>>();

    public constructor(text: string, sourceMappings?: ReadonlyArray<IMapping>) {
        this._scanner = new Scanner(text, sourceMappings);
    }

    public get scanner(): Scanner {
        return this._scanner;
    }

    public get text(): string {
        return this._scanner.text;
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
}