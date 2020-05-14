import { SyntaxKindLike, SyntaxKind } from "../nodes/SyntaxKind";

export namespace SyntaxKindUtils {
    type DescribedSymbol = symbol & { description?: string; };

    const descriptionRegExp: RegExp = /^Symbol\((.*)\)$/;

    function getSymbolDescription(kind: DescribedSymbol): string {
        if (typeof kind.description === 'string') {
            return kind.description;
        }
        const key: string | undefined = Symbol.keyFor(kind);
        if (key !== undefined) {
            return key;
        }
        const text: string = kind.toString();
        const match: RegExpExecArray | null = descriptionRegExp.exec(text);
        return match ? match[1] : text;
    }

    export function formatSyntaxKind(kind: SyntaxKindLike): string {
        // user defined kind
        if (typeof kind === 'symbol') {
            return getSymbolDescription(kind);
        }
        const text: string = SyntaxKind[kind];
        if (typeof text === 'string') {
            return text;
        }
        return kind.toString();
    }
}