export namespace StringUtils {
    export function repeat(text: string, count: number): string {
        let s: string = '';
        while (count-- > 0) {
            s += text;
        }
        return s;
    }
}