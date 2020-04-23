import { Node } from "../nodes/Node";
import { Scanner } from "./Scanner";
import { LineMap } from "./LineMap";
import { IMapping } from "./Preprocessor";
import { ContentWriter } from "./ContentWriter";
import { MarkdownHtmlBlockType } from "./blockParsers/MarkdownHtmlBlockParser";

export interface IParserState {
    closed?: boolean;
    lastLineIsBlank?: boolean; 
    lastLineChecked?: boolean;
    content?: ContentWriter;
    info?: string;
    literal?: string;
    text?: string;
    htmlBlockType?: MarkdownHtmlBlockType;
    refLabel?: string;
} 

export abstract class ParserBase {
    /** @ignore */
    public static readonly parserState: unique symbol = Symbol();

    private _scanner: Scanner;
    private _lineMap: LineMap | undefined;

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