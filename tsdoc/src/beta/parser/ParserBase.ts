import { Node } from "../nodes/Node";
import { Scanner } from "./Scanner";
import { LineMap } from "./LineMap";
import { IMapping } from "./Preprocessor";

export abstract class ParserBase {
    private _scanner: Scanner;
    private _lineMap: LineMap | undefined;
    private _weakParserState = new WeakMap<object, WeakMap<Node, any>>();

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

    public getState<K extends object, TNode extends Node, U>(key: K, node: TNode, createState: (node: TNode, key: K) => U) {
        let nodeMap: WeakMap<Node, any> | undefined = this._weakParserState.get(key);
        if (nodeMap === undefined) this._weakParserState.set(key, nodeMap = new WeakMap());
        let nodeState: any = nodeMap.get(node);
        if (nodeState === undefined) nodeMap.set(node, nodeState = createState(node, key));
        return nodeState;
    }
}