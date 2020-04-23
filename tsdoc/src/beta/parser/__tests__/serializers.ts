import { SyntaxKind } from "../../nodes/SyntaxKind";
import { Token } from "../Token";
import { Node } from "../../nodes/Node";
import { MarkdownCodeBlock } from "../../nodes/MarkdownCodeBlock";
import { MarkdownHeading } from "../../nodes/MarkdownHeading";
import { MarkdownList } from "../../nodes/MarkdownList";

import PrettyFormat = require("pretty-format");
import { Document } from "../../nodes/Document";
import { MarkdownCodeSpan } from "../../nodes/MarkdownCodeSpan";
import { Run } from "../../nodes/Run";
import { MarkdownHtmlInline } from "../../nodes/MarkdownHtmlInline";
import { MarkdownAutoLink } from "../../nodes/MarkdownAutoLink";
import { MarkdownLinkLabel } from "../../nodes/MarkdownLinkLabel";
import { MarkdownLinkTitle } from "../../nodes/MarkdownLinkTitle";
import { MarkdownLinkDestination } from "../../nodes/MarkdownLinkDestination";
import { MarkdownLinkReference } from "../../nodes/MarkdownLinkReference";
import { MarkdownLink } from "../../nodes/MarkdownLink";
import { MarkdownImage } from "../../nodes/MarkdownImage";
import { IParserState, ParserBase } from "../ParserBase";
import { Content } from "../../nodes/Content";
import { MarkdownListItem } from "../../nodes/MarkdownListItem";
export type Config = PrettyFormat.Config;
export type Printer = (value: unknown, config: Config, indentation: string, depth: number, refs: ReadonlyArray<object>) => string;

export enum Placement {
    AtStart = -1,
    Default = 0,
    AtEnd = 1
}

export class SnapshotView<T> {
    public readonly value: T;
    public readonly format: (value: T, print: (value: unknown) => string) => string | undefined;
    public readonly placement: Placement;
    public readonly weight: number;
    constructor(value: T, format: (value: T, print: (value: unknown) => string) => string | undefined = (value, print) => print(value), placement: Placement = Placement.Default, weight: number = 0) {
        this.value = value;
        this.format = format;
        this.placement = placement;
        this.weight = weight;
    }
    public getView(config: Config, indentation: string, depth: number, refs: ReadonlyArray<object>, printer: Printer): string | undefined {
        return this.format(this.value, value => printer(value, config, indentation, depth, refs));
    }
}

export class EnumView<T extends number> extends SnapshotView<T> {
    constructor(value: T, enumObject: object, placement?: Placement, weight?: number) {
        super(value, (value, print) => {
            const formattedValue: string = print(value);
            for (const enumName of Object.keys(enumObject)) {
                const enumValue: unknown = enumObject[enumName as keyof object];
                if (enumValue === value) {
                    return `${formattedValue} (${enumName})`;
                }
            }
            return formattedValue;
        }, placement, weight);
    }
}

export class IgnoreView<T> extends SnapshotView<T> {
    constructor(value: T) {
        super(value, () => undefined);
    }
}

function functionName(func: unknown): string {
    return typeof func === "function" && (func as any).name || "Object";
}

function getPlacement(value: unknown): Placement {
    return value instanceof SnapshotView ? value.placement : Placement.Default;
}

function getWeight(value: unknown): number {
    return value instanceof SnapshotView ? value.weight : 0;
}

function compareNumbers(a: number, b: number): number {
    return a - b;
}

function compareKeys(a: string | symbol, b: string | symbol): number {
    a = a.toString();
    b = b.toString();
    return a < b ? -1 : a > b ? 1 : 0;
}

function compareEntries(a: [string | symbol, unknown], b: [string | symbol, unknown]): number {
    return compareNumbers(getPlacement(a[1]), getPlacement(b[1]))
        || compareNumbers(getWeight(a[1]), getWeight(b[1]))
        || compareKeys(a[0], b[0]);
}

function serializeSnapshotSerializable(serializable: ISnapshotSerializable, config: Config, indentation: string, depth: number, refs: ReadonlyArray<object>, printer: Printer): string {
    const object: object = serializable instanceof SnapshotProxy ? serializable.value : serializable;
    if (refs.indexOf(object) !== -1) return "[Circular]";
    refs = [...refs, object];

    const snapshot: unknown = serializable[SnapshotSerializer.toSnapshot]();
    if (typeof snapshot !== "object" || snapshot === null) {
        return printer(snapshot, config, indentation, depth, refs);
    }

    const entries: Array<[string | symbol, unknown]> = Object
        .keys(snapshot)
        .map((k: string | symbol) => [k, snapshot[k as never]]);

    const atMaxDepth: boolean = ++depth > config.maxDepth;
    if (atMaxDepth) {
        return `[${functionName(object.constructor)}]`;
    }

    let result: string = "";
    if (entries.length) {
        entries.sort(compareEntries);
        const indentationNext: string = indentation + config.indent;
        for (let i: number = 0; i < entries.length; i++) {
            const [key, value] = entries[i];
            const formattedValue: string | undefined = value instanceof SnapshotView ?
                value.getView(config, indentationNext, depth + 1, refs, printer) :
                printer(value, config, indentationNext, depth + 1, refs);
            const formattedKey: string = printer(key, config, indentationNext, depth + 1, refs);
            if (formattedValue !== undefined) {
                if (result) {
                    result += `,${config.spacingInner}`;
                }
                result += `${indentationNext}${formattedKey}: ${formattedValue}`;
            }
        }
        if (result && !config.min) {
            result += ",";
        }
        result = config.spacingOuter + result + config.spacingOuter + indentation;
    }
    result = (config.min ? "{" : `${functionName(object.constructor)} {`) + result + "}";
    return result;
}

export interface ISnapshotSerializable {
    [SnapshotSerializer.toSnapshot](): unknown;
}

export namespace SnapshotSerializer {
    export const toSnapshot: unique symbol = Symbol();

    function test(value: unknown): value is SnapshotView<unknown> | Node | ISnapshotSerializable {
        return value instanceof SnapshotView
            || value instanceof Node
            || typeof value === "object" && value !== null && toSnapshot in value;
    }

    function serialize(value: unknown, config: Config, indentation: string, depth: number, refs: ReadonlyArray<object>, printer: Printer): string {
        if (test(value)) {
            if (value instanceof SnapshotView) {
                return value.getView(config, indentation, depth, refs, printer) || "undefined";
            } else if (value instanceof Node) {
                return serializeSnapshotSerializable(new SnapshotProxy(value, nodeToSnapshot), config, indentation, depth, refs, printer);
            } else {
                return serializeSnapshotSerializable(value, config, indentation, depth, refs, printer);
            }
        }
        return printer(value, config, indentation, depth, refs);
    }

    export interface PrettyFormatPlugin extends jest.SnapshotSerializerPlugin {
        serialize?(value: unknown, config: Config, indentation: string, depth: number, refs: ReadonlyArray<object>, printer: Printer): string;
    }

    export const serializer: PrettyFormatPlugin = {
        test,
        // NOTE: necessary to satisfy Jest's `SnapshotSerializerPlugin` interface, but pretty-format will actually use `serialize`, below.
        print: () => { throw new Error("Not supported. Use 'serialize'."); },
        serialize
    };

    export function custom<T>(value: T, format: (value: T, print: (value: unknown) => string) => string | undefined, placement?: Placement, weight?: number): SnapshotView<T> {
        return new SnapshotView(value, format, placement, weight);
    }

    export function ignore<T>(value: T): SnapshotView<T> {
        return new IgnoreView(value);
    }

    export function ignoreIfUndefined<T>(value: T, placement?: Placement, weight?: number): SnapshotView<T> {
        return value === undefined ? new IgnoreView(value) : new SnapshotView(value, undefined, placement, weight);
    }

    export function enumValue<T extends number>(value: T, enumObject: object, placement?: Placement, weight?: number): SnapshotView<T> {
        return new EnumView(value, enumObject, placement, weight);
    }

    export function ordered<T>(value: T | SnapshotView<T>, placement: Placement, weight?: number): SnapshotView<T> {
        return new SnapshotView(
            value instanceof SnapshotView ? value.value : value,
            value instanceof SnapshotView ? value.format : undefined,
            placement,
            weight);
    }
}

export class SnapshotProxy<T extends object> {
    public readonly value: T;
    public readonly toSnapshot: (value: T) => object;
    constructor(value: T, toSnapshot: (value: T) => object) {
        this.value = value;
        this.toSnapshot = toSnapshot;
    }
    [SnapshotSerializer.toSnapshot]() {
        return this.toSnapshot(this.value);
    }
}


function nodeToSnapshotCore(node: Node): object {
    let children: Content[] | undefined;
    if (node.isContent()) {
        for (let child: Content | undefined = node.firstChild; child; child = child.nextSibling) {
            if (!children) children = [];
            children.push(child);
        }
    }

    const parserState: IParserState | undefined = node[ParserBase.parserState];
    const closed: boolean | undefined = parserState && parserState.closed;
    const lastLineIsBlank: boolean | undefined = parserState && parserState.lastLineIsBlank;

    return {
        kind: SnapshotSerializer.enumValue(node.kind, SyntaxKind, Placement.AtStart, -Infinity),
        children: SnapshotSerializer.ignoreIfUndefined(children),
        closed: SnapshotSerializer.ignoreIfUndefined(closed, Placement.Default, -10),
        lastLineIsBlank: SnapshotSerializer.ignoreIfUndefined(lastLineIsBlank),
        pos: node.pos < 0 ?
            SnapshotSerializer.ignore(node.pos) :
            SnapshotSerializer.ordered(node.pos, Placement.AtEnd, 1),
        end: node.end < 0 ?
            SnapshotSerializer.ignore(node.end) :
            SnapshotSerializer.ordered(node.end, Placement.AtEnd, 2),
    };
}

function documentToSnapshot(node: Document): object {
    const references: MarkdownLinkReference[] = [];
    node.referenceMap.forEach(reference => references.push(reference));
    return {
        ...nodeToSnapshotCore(node),
        references: references.length ?
            references :
            SnapshotSerializer.ignore(references)
    };
}

function markdownCodeBlockToSnapshot(node: MarkdownCodeBlock): object {
    return {
        ...nodeToSnapshotCore(node),
        codeFence: node.codeFence && {
            ...node.codeFence,
            token: SnapshotSerializer.enumValue(node.codeFence.token, Token)
        },
        info: node.info,
        literal: node.literal
    };
}

function markdownHeadingToSnapshot(node: MarkdownHeading): object {
    return {
        ...nodeToSnapshotCore(node),
        headingToken: SnapshotSerializer.enumValue(node.headingToken, Token),
        level: node.level
    };
}

function markdownListToSnapshot(node: MarkdownList): object {
    return {
        ...nodeToSnapshotCore(node),
        listMarker: {
            ...node.listMarker,
            bulletToken: SnapshotSerializer.enumValue(node.listMarker.bulletToken, Token)
        }
    };
}

function markdownListItemToSnapshot(node: MarkdownListItem): object {
    return {
        ...nodeToSnapshotCore(node),
        listMarker: {
            ...node.listMarker,
            bulletToken: SnapshotSerializer.enumValue(node.listMarker.bulletToken, Token)
        }
    };
}

function markdownCodeSpanToSnapshot(node: MarkdownCodeSpan): object {
    return {
        ...nodeToSnapshotCore(node),
        backtickCount: node.backtickCount,
        text: node.text
    };
}

function markdownHtmlInlineToSnapshot(node: MarkdownHtmlInline): object {
    return {
        ...nodeToSnapshotCore(node),
        html: node.html
    };
}

function markdownAutoLinkToSnapshot(node: MarkdownAutoLink): object {
    return {
        ...nodeToSnapshotCore(node),
        href: node.destination
    };
}

function markdownLinkLabelToSnapshot(node: MarkdownLinkLabel): object {
    return {
        ...nodeToSnapshotCore(node),
        text: node.text
    };
}

function markdownLinkTitleToSnapshot(node: MarkdownLinkTitle): object {
    const { MarkdownLinkTitleQuoteStyle } = jest.requireActual("../../nodes/MarkdownLinkTitle") as typeof import("../../nodes/MarkdownLinkTitle");
    return {
        ...nodeToSnapshotCore(node),
        text: node.text,
        quoteStyle: SnapshotSerializer.enumValue(node.quoteStyle, MarkdownLinkTitleQuoteStyle)
    };
}

function markdownLinkDestinationToSnapshot(node: MarkdownLinkDestination): object {
    return {
        ...nodeToSnapshotCore(node),
        href: node.href,
        bracketed: node.bracketed
    };
}

function markdownLinkReferenceToSnapshot(node: MarkdownLinkReference): object {
    return {
        ...nodeToSnapshotCore(node),
        label: node.labelSyntax,
        destination: node.destinationSyntax,
        title: SnapshotSerializer.ignoreIfUndefined(node.titleSyntax)
    };
}

function markdownLinkToSnapshot(node: MarkdownLink): object {
    return {
        ...nodeToSnapshotCore(node),
        label: SnapshotSerializer.ignoreIfUndefined(node.labelSyntax),
        destination: SnapshotSerializer.ignoreIfUndefined(node.destinationSyntax),
        title: SnapshotSerializer.ignoreIfUndefined(node.titleSyntax),
        // resolvedReference: SnapshotSerializer.ignoreIfUndefined(node.resolvedReference)
    };
}

function markdownImageToSnapshot(node: MarkdownImage): object {
    return {
        ...nodeToSnapshotCore(node),
        label: SnapshotSerializer.ignoreIfUndefined(node.label),
        destination: SnapshotSerializer.ignoreIfUndefined(node.href),
        title: SnapshotSerializer.ignoreIfUndefined(node.title),
        // resolvedReference: SnapshotSerializer.ignoreIfUndefined(node.resolvedReference)
    };
}

function runToSnapshot(node: Run): object {
    return {
        ...nodeToSnapshotCore(node),
        text: node.text
    };
}

export function nodeToSnapshot(node: Node): object {
    switch (node.kind) {
        case SyntaxKind.Document: return documentToSnapshot(node as Document);
        case SyntaxKind.MarkdownCodeBlock: return markdownCodeBlockToSnapshot(node as MarkdownCodeBlock);
        case SyntaxKind.MarkdownHeading: return markdownHeadingToSnapshot(node as MarkdownHeading);
        case SyntaxKind.MarkdownList: return markdownListToSnapshot(node as MarkdownList);
        case SyntaxKind.MarkdownListItem: return markdownListItemToSnapshot(node as MarkdownListItem);
        case SyntaxKind.MarkdownCodeSpan: return markdownCodeSpanToSnapshot(node as MarkdownCodeSpan);
        case SyntaxKind.MarkdownHtmlInline: return markdownHtmlInlineToSnapshot(node as MarkdownHtmlInline);
        case SyntaxKind.MarkdownAutoLink: return markdownAutoLinkToSnapshot(node as MarkdownAutoLink);
        case SyntaxKind.MarkdownLinkLabel: return markdownLinkLabelToSnapshot(node as MarkdownLinkLabel);
        case SyntaxKind.MarkdownLinkTitle: return markdownLinkTitleToSnapshot(node as MarkdownLinkTitle);
        case SyntaxKind.MarkdownLinkDestination: return markdownLinkDestinationToSnapshot(node as MarkdownLinkDestination);
        case SyntaxKind.MarkdownLinkReference: return markdownLinkReferenceToSnapshot(node as MarkdownLinkReference);
        case SyntaxKind.MarkdownLink: return markdownLinkToSnapshot(node as MarkdownLink);
        case SyntaxKind.MarkdownImage: return markdownImageToSnapshot(node as MarkdownImage);
        case SyntaxKind.Run: return runToSnapshot(node as Run);
        default: return nodeToSnapshotCore(node);
    }
}
