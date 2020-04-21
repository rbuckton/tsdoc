export class ArrayUtils {
    private constructor() {
        // does nothing
    }

    public static identity<T>(value: T): T {
        return value;
    }

    public static compareValues<T>(x: T, y: T): number {
        return x < y ? -1 : x > y ? 1 : 0;
    }

    /**
     * Finds the offset to a value in a sorted array. If the value cannot be found, the
     * twos-complement of the offset of the next highest value is returned.
     */
    public static binarySearch<T>(array: ReadonlyArray<T>, value: T, comparison?: (x: T, y: T) => number): number {
        return ArrayUtils.binarySearchBy(array, value, ArrayUtils.identity, comparison);
    }

    /**
     * Finds the offset to a key in a sorted array. If the key cannot be found, the
     * twos-complement of the offset of the next highest key is returned.
     */
    public static binarySearchBy<T, K>(array: ReadonlyArray<T>, key: K, selector: (value: T) => K, comparison: (x: K, y: K) => number = ArrayUtils.compareValues): number {
        if (array.length === 0 || comparison(key, selector(array[0])) < 0) {
            return -1;
        }
        if (comparison(key, selector(array[array.length - 1])) > 0) {
            return ~array.length;
        }
        let low: number = 0;
        let high: number = array.length - 1;
        while (low <= high) {
            const middle: number = low + ((high - low) >> 1);
            const mid: K = selector(array[middle]);
            const cmp: number = comparison(mid, key);
            if (cmp > 0) {
                high = middle - 1;
            } else if (cmp < 0) {
                low = middle + 1;
            } else {
                return middle;
            }
        }
        return ~low;
    }

    public static leastUpperBound(searchResult: number): number {
        return searchResult < 0 ? ~searchResult : searchResult;
    }

    public static greatestLowerBound(searchResult: number): number {
        return searchResult < 0 ? ~searchResult - 1 : searchResult;
    }

    public static exact(searchResult: number): number {
        return searchResult < 0 ? -1 : searchResult;
    }
}