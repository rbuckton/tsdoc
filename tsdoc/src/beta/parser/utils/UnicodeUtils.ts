import { CharacterCodes } from "../CharacterCodes";

type ES6StringConstructor = StringConstructor & { fromCodePoint(...codePoint: number[]): string; };
type ES6String = string & { codePointAt(position: number): number | undefined; };

export namespace UnicodeUtils {
    export const HIGH_SURROGATE_START: number = 0xd800;
    export const HIGH_SURROGATE_END: number = 0xdbff;
    export const LOW_SURROGATE_START: number = 0xdc00;
    export const LOW_SURROGATE_END: number = 0xdfff;
    export const MAX_ASCII_CODEPOINT: number = 0x007f;
    export const MAX_UNICODE_CODEPOINT: number = 0x10ffff;
    export const BASIC_MULTILINGUAL_PLANE_END: number = 0xffff;
    export const ASTRAL_PLANE_START: number = 0x10000;

    /**
     * Indicates whether a character is a [Unicode High Surrogate](http://www.unicode.org/charts/PDF/UD800.pdf).
     */
    export function isHighSurrogate(charCode: number | undefined): boolean {
        return charCode !== undefined
            && charCode >= UnicodeUtils.HIGH_SURROGATE_START
            && charCode <= UnicodeUtils.HIGH_SURROGATE_END;
    }

    /**
     * Indicates whether a character is a [Unicode Low Surrogate](http://www.unicode.org/charts/PDF/UDC00.pdf).
     */
    export function isLowSurrogate(charCode: number | undefined): boolean {
        return charCode !== undefined
            && charCode >= UnicodeUtils.LOW_SURROGATE_START
            && charCode <= UnicodeUtils.LOW_SURROGATE_END;
    }

    /**
     * Combines a high surrogate and a low surrogate into a Unicode Code Point.
     */
    export function toCodePoint(highSurrogate: number, lowSurrogate: number): number {
        // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        return UnicodeUtils.ASTRAL_PLANE_START +
            (highSurrogate - UnicodeUtils.HIGH_SURROGATE_START) * 0x400 +
            lowSurrogate - UnicodeUtils.LOW_SURROGATE_START;
    }

    function es6CodePointAt(string: string, position: number): number | undefined {
        return (string as ES6String).codePointAt(position);
    }

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt
    function es5CodePointAt(string: string, position: number): number | undefined {
        const size: number = string.length;
        if (position < 0 || position >= size) {
            return undefined;
        }
        const first: number = string.charCodeAt(position);
        if (UnicodeUtils.isHighSurrogate(first) && size > position + 1) {
            const second: number = string.charCodeAt(position + 1);
            if (UnicodeUtils.isLowSurrogate(second)) {
                return UnicodeUtils.toCodePoint(first, second);
            }
        }
        return first;
    }

    let lazyCodePointAt: (text: string, pos: number) => number | undefined = (text, pos) => {
        lazyCodePointAt = typeof (text as ES6String).codePointAt === "function" ?
            es6CodePointAt :
            es5CodePointAt;
        return lazyCodePointAt(text, pos);
    };

    /**
     * Returns the Unicode code point for the character at the specified position in the string.
     * If the position is outside the bounds of the string, `undefined` is returned.
     */
    export function codePointAt(text: string, pos: number): number | undefined {
        return lazyCodePointAt(text, pos);
    }

    /**
     * Computes the number of characters required to represent a Unicode code point.
     */
    export function codePointSize(codePoint: number): number {
        if (codePoint > UnicodeUtils.BASIC_MULTILINGUAL_PLANE_END) {
            return 2;
        }
        return 1;
    }

    function es6StringFromCodePoint(...codePoints: number[]): string {
        return (String as ES6StringConstructor).fromCodePoint(...codePoints);
    }

    // https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/string/fromcodepoint
    function es5StringFromCodePoint(...codePoints: number[]): string {
        const codeUnits: number[] = [];
        let codeLen: number = 0;
        let result: string = "";
        for (let codePoint of codePoints) {
            codePoint = +codePoints;
            // correctly handles all cases including `NaN`, `-Infinity`, `+Infinity`
            // The surrounding `!(...)` is required to correctly handle `NaN` cases
            // The (codePoint>>>0) === codePoint clause handles decimals and negatives
            if (!(codePoint <= UnicodeUtils.MAX_UNICODE_CODEPOINT && (codePoint >>> 0) === codePoint)) {
                throw RangeError("Invalid code point: " + codePoint);
            }
            if (codePoint <= UnicodeUtils.BASIC_MULTILINGUAL_PLANE_END) { // BMP code point
                codeLen = codeUnits.push(codePoint);
            } else { // Astral code point; split in surrogate halves
                // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
                codePoint -= UnicodeUtils.ASTRAL_PLANE_START;
                codeLen = codeUnits.push(
                    (codePoint >> 10) + UnicodeUtils.HIGH_SURROGATE_START,
                    (codePoint % 0x400) + UnicodeUtils.LOW_SURROGATE_START
                );
            }
            if (codeLen >= 0x3fff) {
                result += String.fromCharCode(...codeUnits);
                codeUnits.length = 0;
            }
        }
        return result + String.fromCharCode(...codeUnits);
    }

    let lazyStringFromCodePoint: (...codePoints: number[]) => string = (...codePoints) => {
        lazyStringFromCodePoint = typeof (String as ES6StringConstructor).fromCodePoint === "function" ?
            es6StringFromCodePoint :
            es5StringFromCodePoint;
        return lazyStringFromCodePoint(...codePoints);
    };

    /**
     * Creates a `string` by combining the provided sequence of Unicode code points.
     */
    export function stringFromCodePoint(...codePoints: number[]): string {
        return lazyStringFromCodePoint(...codePoints);
    }

    /**
     * Indicates whether the provided Unicode code point is a valid and complete unicode character.
     */
    export function isValidCodePoint(codePoint: number | undefined): boolean {
        return codePoint !== undefined
            && codePoint === (codePoint >>> 0) // handles `NaN`, `Infinity`, decimals, and negative values.
            && codePoint <= UnicodeUtils.MAX_UNICODE_CODEPOINT
            && (codePoint < UnicodeUtils.HIGH_SURROGATE_START || codePoint > UnicodeUtils.LOW_SURROGATE_END);
    }

    /*
    * Generated by scripts/buildUnicodeMap.js on node v10.17.0 with unicode 12.1
    * Each array below is a flattened array of start/length pairs (inclusive) (i.e., `[32, 2]` means 32 <= cp <= 35).
    *
    * whitespace is based on https://spec.commonmark.org/0.29/#whitespace-character
    * unicodeWhitespace is based on https://spec.commonmark.org/0.29/#unicode-whitespace-character
    * asciiPunctuation is based on https://spec.commonmark.org/0.29/#ascii-punctuation-character
    * unicodePunctuation is based on https://spec.commonmark.org/0.29/#punctuation-character
    */
    const whitespace: ReadonlyArray<number> = [9, 4, 32, 0];
    const unicodeWhitespace: ReadonlyArray<number> = [9, 1, 12, 1, 32, 0, 160, 0, 5760, 0, 8192, 10, 8239, 0, 8287, 0, 12288, 0];
    const asciiPunctuation: ReadonlyArray<number> = [33, 14, 58, 6, 91, 5, 123, 3];
    const unicodePunctuation: ReadonlyArray<number> = [33, 2, 37, 5, 44, 3, 58, 1, 63, 1, 91, 2, 95, 0, 123, 0, 125, 0, 161, 0, 167, 0, 171, 0, 182, 1, 187, 0, 191, 0, 894, 0, 903, 0, 1370, 5, 1417, 1, 1470, 0, 1472, 0, 1475, 0, 1478, 0, 1523, 1, 1545, 1, 1548, 1, 1563, 0, 1566, 1, 1642, 3, 1748, 0, 1792, 13, 2039, 2, 2096, 14, 2142, 0, 2404, 1, 2416, 0, 2557, 0, 2678, 0, 2800, 0, 3191, 0, 3204, 0, 3572, 0, 3663, 0, 3674, 1, 3844, 14, 3860, 0, 3898, 3, 3973, 0, 4048, 4, 4057, 1, 4170, 5, 4347, 0, 4960, 8, 5120, 0, 5742, 0, 5787, 1, 5867, 2, 5941, 1, 6100, 2, 6104, 2, 6144, 10, 6468, 1, 6686, 1, 6816, 6, 6824, 5, 7002, 6, 7164, 3, 7227, 4, 7294, 1, 7360, 7, 7379, 0, 8208, 23, 8240, 19, 8261, 12, 8275, 11, 8317, 1, 8333, 1, 8968, 3, 9001, 1, 10088, 13, 10181, 1, 10214, 9, 10627, 21, 10712, 3, 10748, 1, 11513, 3, 11518, 1, 11632, 0, 11776, 46, 11824, 31, 12289, 2, 12296, 9, 12308, 11, 12336, 0, 12349, 0, 12448, 0, 12539, 0, 42238, 1, 42509, 2, 42611, 0, 42622, 0, 42738, 5, 43124, 3, 43214, 1, 43256, 2, 43260, 0, 43310, 1, 43359, 0, 43457, 12, 43486, 1, 43612, 3, 43742, 1, 43760, 1, 44011, 0, 64830, 1, 65040, 9, 65072, 34, 65108, 13, 65123, 0, 65128, 0, 65130, 1, 65281, 2, 65285, 5, 65292, 3, 65306, 1, 65311, 1, 65339, 2, 65343, 0, 65371, 0, 65373, 0, 65375, 6, 65792, 2, 66463, 0, 66512, 0, 66927, 0, 67671, 0, 67871, 0, 67903, 0, 68176, 8, 68223, 0, 68336, 6, 68409, 6, 68505, 3, 69461, 4, 69703, 6, 69819, 1, 69822, 3, 69952, 3, 70004, 1, 70085, 3, 70093, 0, 70107, 0, 70109, 2, 70200, 5, 70313, 0, 70731, 4, 70747, 0, 70749, 0, 70854, 0, 71105, 22, 71233, 2, 71264, 12, 71484, 2, 71739, 0, 72162, 0, 72255, 7, 72346, 2, 72350, 4, 72769, 4, 72816, 1, 73463, 1, 73727, 0, 74864, 4, 92782, 1, 92917, 0, 92983, 4, 92996, 0, 93847, 3, 94178, 0, 113823, 0, 121479, 4, 125278, 1];

    function lookupUnicode(map: ReadonlyArray<number>, codePoint: number): boolean {
        // binary search in punctuation map
        if (codePoint < map[0]) {
            return false;
        }
        let lo: number = 0;
        let hi: number = map.length;
        let mid: number;
        while (lo + 1 < hi) {
            mid = lo + (hi - lo) / 2;
            mid -= mid % 2;
            const start: number = map[mid];
            const end: number = start + map[mid + 1];
            if (start <= codePoint && codePoint <= end) {
                return true;
            }
            if (codePoint < start) {
                hi = mid;
            } else {
                lo = mid + 2;
            }
        }
        return false;
    }

    /**
     * Indicates whether the provided character is one of: space (`U+0020`), tab (`U+0009`), newline (`U+000A`),
     * line tabulation (`U+000B`), form feed (`U+000C`), or carriage return (`U+000D`).
     */
    export function isAsciiWhitespace(codePoint: number | undefined): codePoint is AsciiWhitespace {
        // https://spec.commonmark.org/0.29/#whitespace-character
        return codePoint !== undefined
            && lookupUnicode(whitespace, codePoint);
    }

    /**
     * Indicates whether the provided character is any code point in the Unicode Zs general category, or a
     * tab (`U+0009`), carriage return (`U+000D`), newline (`U+000A`), or form feed (`U+000C`).
     */
    export function isUnicodeWhitespace(codePoint: number | undefined): codePoint is UnicodeWhitespace {
        // https://spec.commonmark.org/0.29/#unicode-whitespace-character
        return codePoint !== undefined
            && lookupUnicode(unicodeWhitespace, codePoint);
    }

    /**
     * Indicates whether the provided character is one of:
     * `!`, `"`, `#`, `$`, `%`, `&`, `'`, `(`, `)`, `*`, `+`, `,`, `-`, `.`, `/` (`U+0021–002F`),
     * `:`, `;`, `<`, `=`, `>`, `?`, `@` (`U+003A–0040`),
     * `[`, `\`, `]`, `^`, `_`, `` ` `` (`U+005B–0060`),
     * `{`, `|`, `}`, or `~` (`U+007B–007E`).
     */
    export function isAsciiPunctuation(codePoint: number | undefined): codePoint is AsciiPuncuation {
        // https://spec.commonmark.org/0.29/#ascii-punctuation-character
        return codePoint !== undefined
            && lookupUnicode(asciiPunctuation, codePoint);
    }

    /**
     * Indicates whether the provided character is either an ASCII puncutation character or anything in the
     * general Unicode categories `Pc`, `Pd`, `Pe`, `Pf`, `Pi`, `Po`, or `Ps`.
     */
    export function isUnicodePunctuation(codePoint: number | undefined): codePoint is UnicodePunctuation {
        // https://spec.commonmark.org/0.29/#punctuation-character
        return codePoint !== undefined
            && lookupUnicode(unicodePunctuation, codePoint);
    }

    /**
     * Indicates whether the provided character is an ASCII upper-case letter in the range `A-Z` (`U+0041-005A`).
     */
    export function isAsciiUpperCaseLetter(codePoint: number | undefined): codePoint is AsciiUpperCaseLetter {
        return codePoint !== undefined
            && codePoint >= CharacterCodes.A
            && codePoint <= CharacterCodes.Z;
    }

    /**
     * Indicates whether the provided character is an ASCII lower-case letter in the range `a-z` (`U+0061-007A`).
     */
    export function isAsciiLowerCaseLetter(codePoint: number | undefined): codePoint is AsciiLowerCaseLetter {
        return codePoint !== undefined
            && codePoint >= CharacterCodes.a
            && codePoint <= CharacterCodes.z;
    }

    /**
     * Indicates whether the provided character is an ASCII letter in the ranges `A-Z` (`U+0041-005A`)
     * or `a-z` (`U+0061-007A`).
     */
    export function isAsciiLetter(codePoint: number | undefined): codePoint is AsciiLetter {
        return UnicodeUtils.isAsciiUpperCaseLetter(codePoint)
            || UnicodeUtils.isAsciiLowerCaseLetter(codePoint);
    }

    /**
     * Indicates whether the provided character is an ASCII digit in the range `0-9` (`U+0030-0039`).
     */
    export function isDecimalDigit(codePoint: number | undefined): codePoint is DecimalDigit {
        return codePoint !== undefined
            && codePoint >= CharacterCodes._0
            && codePoint <= CharacterCodes._9;
    }

    /**
     * Indicates whether the provided character is an ASCII digit in the ranges `0-9` (`U+0030-0039`),
     * `a-f` (`U+0061-0066`), or `A-F` (`U+0041-0046`).
     */
    export function isHexDigit(codePoint: number | undefined): codePoint is HexDigit {
        return UnicodeUtils.isDecimalDigit(codePoint)
            || (codePoint !== undefined && codePoint >= CharacterCodes.a && codePoint <= CharacterCodes.f)
            || (codePoint !== undefined && codePoint >= CharacterCodes.A && codePoint <= CharacterCodes.F);
    }

    /**
     * Indicates whether the provided character is a Unicode line terminator as recognized by ECMA-262.
     */
    export function isLineTerminator(codePoint: number | undefined): codePoint is LineTerminator {
        // https://tc39.es/ecma262/#prod-LineTerminator
        return codePoint === CharacterCodes.carriageReturn
            || codePoint === CharacterCodes.lineFeed
            || codePoint === CharacterCodes.lineSeparator
            || codePoint === CharacterCodes.paragraphSeparator;
    }

    /**
     * Indicates whether the provided character is either space (`U+0020`) or tab (`U+0009`).
     */
    export function isSpaceOrTab(codePoint: number | undefined): codePoint is SpaceOrTab {
        return codePoint === CharacterCodes.space
            || codePoint === CharacterCodes.tab;
    }

    /**
     * Indicates whether the provided character is an ASCII control character.
     */
    export function isControl(codePoint: number | undefined): codePoint is ControlCharacter {
        return codePoint !== undefined
            && (codePoint >= 0x0000 && codePoint <= 0x001f
                || codePoint === 0x0007f
                || codePoint >= 0x0080 && codePoint <= 0x009f);
    }
}

// The following types help with removing the `undefined` portion of a codePoint in the above tests
// without excluding `number` in the false branch.
export type AsciiWhitespace = number & { _tagAsciiWhitespace: never };
export type AsciiPuncuation = number & { _tagAsciiPunctuation: never };
export type AsciiUpperCaseLetter = number & { _tagAsciiUpperCaseLetter: never };
export type AsciiLowerCaseLetter = number & { _tagAsciiLowerCaseLetter: never };
export type AsciiLetter = AsciiUpperCaseLetter | AsciiLowerCaseLetter;
export type DecimalDigit = number & { _tagDecimalDigit: never };
export type HexDigit = number & { _tagHexDigit: never };
export type LineTerminator = number & { _tagLineTerminator: never };
export type UnicodeWhitespace = number & { _tagUnicodeWhitespace: never };
export type UnicodePunctuation = number & { _tagUnicodePunctuation: never };
export type SpaceOrTab = number & { _tagSpaceOrTab: never };
export type ControlCharacter = number & { _tagControlCharacter: never };