import { ArrayUtils } from "./utils/ArrayUtils";

export interface IMapping {
    readonly pos: number;
    readonly sourcePos: number;
}

function selectPos(mapping: IMapping): number {
    return mapping.pos;
}

function selectSourcePos(mapping: IMapping): number {
    return mapping.sourcePos;
}

export class Mapper {
    private _mappings: ReadonlyArray<IMapping> | undefined;

    constructor(mappings: ReadonlyArray<IMapping> | undefined) {
        if (mappings) {
            if (mappings.length === 0) {
                mappings = undefined;
            } else if (mappings[0].pos !== 0) {
                throw new Error("Array must contain at least one item that starts at position 0.");
            } else if (mappings.length > 1) {
                let lastMapping: IMapping = mappings[0];
                for (let i: number = 1; i < mappings.length; i++) {
                    const mapping: IMapping = mappings[i];
                    if (mapping.pos <= lastMapping.pos || mapping.sourcePos <= lastMapping.sourcePos) {
                        throw new Error("Mappings are not properly ordered.");
                    }
                    lastMapping = mapping;
                }
            }
        }
        this._mappings = mappings;
    }

    public get mappings(): ReadonlyArray<IMapping> | undefined {
        return this._mappings;
    }

    private _findMapping(pos: number, mappingIndex: number = 0, selector: (mapping: IMapping) => number): number {
        if (!this._mappings) {
            return -1;
        }

        if (mappingIndex >= 0 && mappingIndex < this._mappings.length) {
            const mapping: IMapping = this._mappings[mappingIndex];
            const nextMapping: IMapping | undefined = mappingIndex + 1 < this._mappings.length ?
                this._mappings[mappingIndex + 1] :
                undefined;

            if (pos >= selector(mapping) && (!nextMapping || pos < selector(nextMapping))) {
                return mappingIndex;
            }
        }

        return ArrayUtils.greatestLowerBound(ArrayUtils.binarySearchBy(this._mappings, pos, selector));
    }

    public toPos(sourcePos: number, mappingIndex?: number): number {
        mappingIndex = this._findMapping(sourcePos, mappingIndex, selectSourcePos);
        if (!this._mappings) return sourcePos;
        if (mappingIndex === -1) return -1;
        const mapping: IMapping = this._mappings[mappingIndex];
        return sourcePos - mapping.sourcePos + mapping.pos;
    }

    public toSourcePos(pos: number, mappingIndex?: number): number {
        mappingIndex = this._findMapping(pos, mappingIndex, selectPos);
        if (!this._mappings) return pos;
        if (mappingIndex === -1) return -1;
        const mapping: IMapping = this._mappings[mappingIndex];
        return pos - mapping.pos + mapping.sourcePos;
    }
}