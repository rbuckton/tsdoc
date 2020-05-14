import { UnicodeUtils } from "./UnicodeUtils";
import { CharacterCodes } from "../parser/CharacterCodes";
import { HtmlUtils } from "./HtmlUtils";

export namespace MarkdownUtils {
    // https://spec.commonmark.org/0.29/#backslash-escapes
    // https://spec.commonmark.org/0.29/#entity-and-numeric-character-references
    const characterUnescapeRegExp: RegExp = /\\([!"#$%&\'()*+,./:;<=>?@\[\\\]^_`{|}~-])|&(?:#x([a-f0-9]{1,6})|#([0-9]{1,7})|([a-z][a-z0-9]*));/gi;

    function unescapeWorker(input: string, punctuation: string | undefined, hex: string | undefined, dec: string | undefined, name: string | undefined): string {
        if (punctuation) return punctuation;
        if (hex || dec) {
            let codePoint: number = parseInt(hex || dec!, hex ? 16 : 10);
            if (!isFinite(codePoint) || codePoint === 0 || !UnicodeUtils.isValidCodePoint(codePoint)) {
                codePoint = CharacterCodes.replacementCharacter;
            }
            return UnicodeUtils.stringFromCodePoint(codePoint);
        }
        if (name) {
            const codePoints: ReadonlyArray<number> | undefined = HtmlUtils.htmlEntityNameToCodePoints(name);
            if (codePoints !== undefined) {
                return UnicodeUtils.stringFromCodePoint(...codePoints);
            }
        }
        return input;
    }

    export function unescapeString(s: string): string {
        return s.replace(characterUnescapeRegExp, unescapeWorker);
    }

    const characterEscapeRegExp: RegExp = /([\\\[*_])/gi;

    export interface IEscapeStringOptions {
        atStartOfLine?: boolean;
    }

    export function escapeString(s: string, options: IEscapeStringOptions = {}): string {
        return s.replace(characterEscapeRegExp, (_, backslash) => '\\' + backslash);
    }

    export function trimBlankLines(s: string): string {
        return s.replace(/(\n *)+$/, "\n");
    }

    export function normalizeLinkReference(text: string): string {
        // https://spec.commonmark.org/0.29/#matches
        return text.trim()
            .replace(/[ \t\r\n]+/, " ")
            .toLowerCase()
            .toUpperCase();
    }

    const percentEscapeRegExp: RegExp = /(%[0-9a-f]{2}|[0-9a-z;/?:@&=+$,_.!~*'()#-])|(.)/ig;

    export function normalizeURL(s: string): string {
        percentEscapeRegExp.lastIndex = -1;
        return s.replace(percentEscapeRegExp, (_, safe, unsafe) => safe ? safe : encodeURIComponent(unsafe));
    }
}