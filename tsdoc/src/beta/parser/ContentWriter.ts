import { IMapping } from "./Mapper";

interface IMutableMapping {
    pos: number;
    sourcePos: number;
}

/**
 * Writes unparsed inline content along with mappings to the original source.
 */
export class ContentWriter {
    private _lastSegment: IMutableMapping = { pos: 0, sourcePos: 0 };
    private _sourceSegments: IMapping[] = [this._lastSegment];
    private _text: string ;

    public constructor(text: string = '') {
        this._text = text;
    }

    /**
     * Gets the mappings associated with the content.
     */
    public get mappings(): IMapping[] {
        return this._sourceSegments;
    }

    /**
     * Gets the length of the content.
     */
    public get length(): number {
        return this._text.length;
    }

    /**
     * Adds a new mapping entry for the provided source position.
     */
    public addMapping(sourcePos: number): void {
        if (this._lastSegment.pos === this.length) {
            this._lastSegment.sourcePos = sourcePos;
        } else {
            this._sourceSegments.push({ pos: this.length, sourcePos });
        }
    }

    /**
     * Writes the provided string.
     */
    public write(text: string): void {
        if (text) {
            this._text += text;
        }
    }

    /**
     * Gets the string content of the writer.
     */
    public toString(): string {
        return this._text;
    }

    /**
     * Clears the content writer.
     */
    public clear(): void {
        this._lastSegment = { pos: 0, sourcePos: 0 };
        this._sourceSegments = [this._lastSegment];
        this._text = '';
    }
}
