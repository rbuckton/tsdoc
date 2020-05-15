import { Node } from "../nodes/Node";
import { TSDocConfiguration } from "../../configuration/TSDocConfiguration";

export class HtmlWriter {
    private _buffer: string = '';
    private _lastOut: string = '\n';
    private _disableTags: number = 0;
    private _emit: (node: Node) => void;
    private _tagFilter: ((tagName: string) => boolean) | undefined;
    private _configuration: TSDocConfiguration;

    constructor(configuration: TSDocConfiguration, emit: (node: Node) => void, tagFilter?: (tagName: string) => boolean) {
        this._configuration = configuration;
        this._emit = emit;
        this._tagFilter = tagFilter;
    }

    public get configuration(): TSDocConfiguration {
        return this._configuration;
    }

    public get tagsDisabled(): boolean {
        return this._disableTags > 0;
    }

    public disableTags(): void {
        this._disableTags++;
    }

    public enableTags(): void {
        if (this._disableTags === 0) throw new Error("Unbalanced call to disableTags/enableTags");
        this._disableTags--;
    }

    public writeRaw(str: string): void {
        this._buffer += str;
        this._lastOut = str;
    }

    public writeLine(): void {
        if (this._lastOut !== '\n') {
            this.writeRaw('\n');
        }
    }

    public write(str: string): void {
        this.writeRaw(this.escapeText(str));
    }

    public escapeText(str: string): string {
        return str.replace(/[&<>"]/g, ch =>
            ch === '&' ? '&amp;' :
            ch === '<' ? '&lt;' :
            ch === '>' ? '&gt;' :
            ch === '"' ? '&quot;' :
            ch);
    }

    public writeTag(name: string, attributes?: [string, string][], selfClosing?: boolean): void {
        if (this._disableTags > 0) return;
        this._buffer += (this._isSafeTag(name) ? '<' : '&lt;') + name;
        if (attributes && attributes.length) {
            for (const [key, value] of attributes) {
                this._buffer += ' ' + key + '="' + value + '"';
            }
        }
        if (selfClosing) {
            this._buffer += ' /';
        }
        this._buffer += '>';
        this._lastOut = '>';
    }

    public writeHtml(html: string): void {
        this.writeRaw(html.replace(/(<)(?=([a-z][a-z0-9-]*)(?:\s|>))/ig, (_, bracket, tagName) => this._isSafeTag(tagName) ? _ : '&lt;'));
    }

    public writeContents(node: Node): void {
        if (node.isContent()) {
            node.forEachChild(this._emit);
        }
    }

    public toString(): string {
        return this._buffer;
    }

    private _isSafeTag(tagName: string): boolean {
        return !this._tagFilter || this._tagFilter.call(undefined, tagName);
    }
}
