import { Node } from "../nodes/Node";
import { Scanner } from "./Scanner";
import { LineMap } from "./LineMap";
import { IMapping } from "./Preprocessor";
import { ContentWriter } from "./ContentWriter";

export interface IParserState {
    closed?: boolean;
    lastLineIsBlank?: boolean; 
    lastLineChecked?: boolean;
    content?: ContentWriter;
    refLabel?: string;
} 

export abstract class ParserBase {
    /** @ignore */
    public static readonly parserState: unique symbol = Symbol();

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

    public getParserState(node: Node): IParserState {
        let state: IParserState | undefined = node[ParserBase.parserState];
        if (!state) {
            state = node[ParserBase.parserState] = {};
        }
        return state;
    }

    public setParserState(node: Node, newState: Partial<IParserState>): void {
        const state: IParserState = this.getParserState(node);
        for (const key of Object.keys(newState) as Array<keyof IParserState>) {
            const value: unknown = newState[key];
            if (value !== undefined) {
                state[key] = value as never;
            }
        }
    }
}