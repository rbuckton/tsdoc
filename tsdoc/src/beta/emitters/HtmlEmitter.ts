import { SyntaxKind } from "../nodes/SyntaxKind";
import { Node } from "../nodes/Node";
import { Run } from "../nodes/Run";
import { ListMarker } from "../nodes/MarkdownListItem";
import { MarkdownList } from "../nodes/MarkdownList";
import { MarkdownListItem } from "../nodes/MarkdownListItem";
import { MarkdownCodeBlock } from "../nodes/MarkdownCodeBlock";
import { MarkdownHeading } from "../nodes/MarkdownHeading";
import { MarkdownCodeSpan } from "../nodes/MarkdownCodeSpan";
import { MarkdownLink } from "../nodes/MarkdownLink";
import { MarkdownEmSpan } from "../nodes/MarkdownEmSpan";
import { MarkdownThematicBreak } from "../nodes/MarkdownThematicBreak";
import { MarkdownImage } from "../nodes/MarkdownImage";
import { MarkdownBlockQuote } from "../nodes/MarkdownBlockQuote";
import { MarkdownHtmlInline } from "../nodes/MarkdownHtmlInline";
import { MarkdownHtmlBlock } from "../nodes/MarkdownHtmlBlock";
import { MarkdownParagraph } from "../nodes/MarkdownParagraph";
import { GfmTable } from "../nodes/GfmTable";
import { GfmTableRow } from "../nodes/GfmTableRow";
import { GfmTableCell } from "../nodes/GfmTableCell";
import { TableAlignment } from "../nodes/TableBase";
import { GfmTaskList } from "../nodes/GfmTaskList";
import { GfmTaskListItem } from "../nodes/GfmTaskListItem";
import { GfmStrikethroughSpan } from "../nodes/GfmStrikethroughSpan";

export class HtmlEmitter {
    private _buffer: string = '';
    private _lastOut: string = '\n';
    private _disableTags: number = 0;
    private _tagFilter: ((tagName: string) => boolean) | undefined;
    
    constructor(tagFilter?: (tagName: string) => boolean) {
        this._tagFilter = tagFilter;
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

    private _emitRun(node: Run): void {
        this.write(node.text);
    }

    private _emitMarkdownSoftBreak(): void {
        this.writeRaw('\n');
    }

    private _emitMarkdownHardBreak(): void {
        this.writeTag('br', [], true);
        this.writeLine();
    }

    private _emitMarkdownLink(node: MarkdownLink, entering: boolean): void {
        const attrs: [string, string][] = [];
        if (entering) {
            attrs.push(['href', this.escapeText(node.destination)]);
            if (node.title) {
                attrs.push(['title', this.escapeText(node.title)]);
            }
            this.writeTag('a', attrs);
        } else {
            this.writeTag('/a');
        }
    }

    private _emitMarkdownImage(node: MarkdownImage, entering: boolean): void {
        if (entering) {
            if (this._disableTags === 0) {
                this.writeRaw('<img src="' + this.escapeText(node.destination) + '" alt="');
            }
            this._disableTags++;
        } else {
            this._disableTags--;
            if (this._disableTags === 0) {
                if (node.title) {
                    this.writeRaw('" title="' + this.escapeText(node.title));
                }
                this.writeRaw('" />');
            }
        }
    }

    private _emitMarkdownEmSpan(node: MarkdownEmSpan, entering: boolean): void {
        this.writeTag(entering ? 'em' : '/em');
    }

    private _emitMarkdownStrongSpan(node: MarkdownEmSpan, entering: boolean): void {
        this.writeTag(entering ? 'strong' : '/strong');
    }

    private _emitMarkdownParagraph(node: MarkdownParagraph, entering: boolean): void {
        const parent: Node | undefined = node.parent;
        if (parent && parent.isListItem() && parent.listMarker.tight) {
            return;
        }
        if (entering) {
            this.writeLine();
            this.writeTag('p');
        } else {
            this.writeTag('/p');
            this.writeLine();
        }
    }

    private _emitMarkdownHeading(node: MarkdownHeading, entering: boolean): void {
        const tagname: string = `h${node.level}`;
        if (entering) {
            this.writeLine();
            this.writeTag(tagname);
        } else {
            this.writeTag(`/${tagname}`);
            this.writeLine();
        }
    }

    private _emitMarkdownCodeSpan(node: MarkdownCodeSpan): void {
        this.writeTag('code');
        this.write(node.text);
        this.writeTag('/code');
    }

    private _emitMarkdownCodeBlock(node: MarkdownCodeBlock): void {
        const info: string[] | undefined = node.info ? node.info.split(/\s+/) : [];
        const attrs: [string, string][] = [];
        if (info.length > 0 && info[0].length > 0) {
            attrs.push(['class', 'language-' + this.escapeText(info[0])]);
        }
        this.writeLine();
        this.writeTag('pre');
        this.writeTag('code', attrs);
        this.write(node.literal);
        this.writeTag('/code');
        this.writeTag('/pre');
        this.writeLine();
    }

    private _emitMarkdownThematicBreak(node: MarkdownThematicBreak): void {
        this.writeLine();
        this.writeTag('hr', [], true);
        this.writeLine();
    }

    private _emitMarkdownBlockQuote(node: MarkdownBlockQuote, entering: boolean): void {
        this.writeLine();
        this.writeTag(entering ? 'blockquote' : '/blockquote');
        this.writeLine();
    }

    private _emitMarkdownList(node: MarkdownList, entering: boolean): void {
        const listMarker: ListMarker | undefined = node.firstChildMarkdownListItem ? node.firstChildMarkdownListItem.listMarker : undefined;
        const tagname: string = listMarker && listMarker.ordered ? 'ol' : 'ul';
        const attrs: [string, string][] = [];

        if (entering) {
            const start: number | undefined = listMarker && listMarker.ordered ? listMarker.start : undefined;
            if (start !== undefined && start !== 1) {
                attrs.push(['start', start.toString()]);
            }
            this.writeLine();
            this.writeTag(tagname, attrs);
            this.writeLine();
        } else {
            this.writeLine();
            this.writeTag('/' + tagname);
            this.writeLine();
        }
    }

    private _emitMarkdownListItem(node: MarkdownListItem, entering: boolean): void {
        if (entering) {
            this.writeTag('li');
        } else {
            this.writeTag('/li');
            this.writeLine();
        }
    }

    private _emitMarkdownHtmlInline(node: MarkdownHtmlInline): void {
        this._writeHtml(node.html);
    }

    private _writeHtml(html: string): void {
        this.writeRaw(html.replace(/(<)(?=([a-z][a-z0-9-]*)(?:\s|>))/ig, (_, bracket, tagName) => this._isSafeTag(tagName) ? _ : '&lt;'));
    }

    private _emitMarkdownHtmlBlock(node: MarkdownHtmlBlock): void {
        this.writeLine();
        this._writeHtml(node.literal);
        this.writeLine();
    }

    private _emitGfmTable(node: GfmTable, entering: boolean): void {
        this.writeLine();
        this.writeTag(entering ? 'table' : '/table');
        this.writeLine();
    }

    private _emitGfmTableRow(node: GfmTableRow, entering: boolean): void {
        if (entering) {
            if (node.isHeaderRow()) {
                this.writeLine();
                this.writeTag('thead');
            } else if (node.parentTable && node.parentTable.firstDataRow === node) {
                this.writeLine();
                this.writeTag('tbody');
            }
        }

        this.writeLine();
        this.writeTag(entering ? 'tr' : '/tr');
        this.writeLine();

        if (!entering) {
            if (node.isHeaderRow()) {
                this.writeTag('/thead');
                this.writeLine();
            } else if (node.parentTable && node.parentTable.lastDataRow === node) {
                this.writeTag('/tbody');
                this.writeLine();
            }
        }
    }

    private _emitGfmTableCell(node: GfmTableCell, entering: boolean): void {
        if (entering) {
            const alignment: TableAlignment = node.alignment;
            const attrs: [string, string][] | undefined =
                alignment === TableAlignment.Left ? [['align', 'left']] :
                alignment === TableAlignment.Center ? [['align', 'center']] :
                alignment === TableAlignment.Right ? [['align', 'right']] :
                undefined;
            this.writeLine();
            this.writeTag(node.isHeaderCell() ? 'th' : 'td', attrs);
        } else {
            this.writeTag(node.isHeaderCell() ? '/th' : '/td');
            this.writeLine();
        }
    }

    private _emitGfmTaskList(node: GfmTaskList, entering: boolean): void {
        const attrs: [string, string][] = [];
        if (entering) {
            this.writeLine();
            this.writeTag('ul', attrs);
            this.writeLine();
        } else {
            this.writeLine();
            this.writeTag('/ul');
            this.writeLine();
        }
    }

    private _emitGfmTaskListItem(node: GfmTaskListItem, entering: boolean): void {
        if (entering) {
            const attrs: [string, string][] = [];
            if (node.listMarker.checked) {
                attrs.push(['checked', '']);
            }
            attrs.push(['disabled', ''], ['type', 'checkbox']);
            this.writeTag('li');
            this.writeTag('input', attrs);
            this.write(' ');
        } else {
            this.writeTag('/li');
            this.writeLine();
        }
    }

    private _emitGfmStrikethroughSpan(node: GfmStrikethroughSpan, entering: boolean): void {
        this.writeTag(entering ? 'del' : '/del');
    }

    protected emitBeginEnd<T extends Node>(node: T, onEmit: (this: this, node: T, entering: boolean) => void): void {
        onEmit.call(this, node, /*entering*/ true);
        this.emitContent(node);
        onEmit.call(this, node, /*entering*/ false);
    }

    protected emitContent(node: Node): void {
        if (node.isContent()) {
            node.forEachChild(child => this.emit(child));
        }
    }

    public emit(node: Node) {
        switch (node.kind) {
            // blocks
            case SyntaxKind.Document:
                return this.emitContent(node);
            case SyntaxKind.MarkdownThematicBreak:
                return this._emitMarkdownThematicBreak(node as MarkdownThematicBreak);
            case SyntaxKind.MarkdownHeading:
                return this.emitBeginEnd(node as MarkdownHeading, this._emitMarkdownHeading);
            case SyntaxKind.MarkdownCodeBlock:
                return this._emitMarkdownCodeBlock(node as MarkdownCodeBlock);
            case SyntaxKind.MarkdownHtmlBlock:
                return this._emitMarkdownHtmlBlock(node as MarkdownHtmlBlock);
            case SyntaxKind.MarkdownParagraph:
                return this.emitBeginEnd(node as MarkdownParagraph, this._emitMarkdownParagraph);
            case SyntaxKind.MarkdownBlockQuote:
                return this.emitBeginEnd(node as MarkdownBlockQuote, this._emitMarkdownBlockQuote);
            case SyntaxKind.MarkdownList:
                return this.emitBeginEnd(node as MarkdownList, this._emitMarkdownList);
            case SyntaxKind.MarkdownListItem:
                return this.emitBeginEnd(node as MarkdownListItem, this._emitMarkdownListItem);
            case SyntaxKind.GfmTable:
                return this.emitBeginEnd(node as GfmTable, this._emitGfmTable);
            case SyntaxKind.GfmTableRow:
                return this.emitBeginEnd(node as GfmTableRow, this._emitGfmTableRow);
            case SyntaxKind.GfmTableCell:
                return this.emitBeginEnd(node as GfmTableCell, this._emitGfmTableCell);
            case SyntaxKind.GfmTaskList:
                return this.emitBeginEnd(node as GfmTaskList, this._emitGfmTaskList);
            case SyntaxKind.GfmTaskListItem:
                return this.emitBeginEnd(node as GfmTaskListItem, this._emitGfmTaskListItem);
            // inlines
            case SyntaxKind.MarkdownCodeSpan:
                return this._emitMarkdownCodeSpan(node as MarkdownCodeSpan);
            case SyntaxKind.MarkdownEmSpan:
                return this.emitBeginEnd(node as MarkdownEmSpan, this._emitMarkdownEmSpan);
            case SyntaxKind.MarkdownStrongSpan:
                return this.emitBeginEnd(node as MarkdownEmSpan, this._emitMarkdownStrongSpan);
            case SyntaxKind.MarkdownLink:
                return this.emitBeginEnd(node as MarkdownLink, this._emitMarkdownLink);
            case SyntaxKind.MarkdownImage:
                return this.emitBeginEnd(node as MarkdownImage, this._emitMarkdownImage);
            case SyntaxKind.MarkdownHtmlInline:
                return this._emitMarkdownHtmlInline(node as MarkdownHtmlInline);
            case SyntaxKind.MarkdownHardBreak:
                return this._emitMarkdownHardBreak();
            case SyntaxKind.MarkdownSoftBreak:
                return this._emitMarkdownSoftBreak();
            case SyntaxKind.Run:
                return this._emitRun(node as Run);
            case SyntaxKind.MarkdownLinkReference:
                break;
            case SyntaxKind.GfmStrikethroughSpan:
                return this.emitBeginEnd(node as GfmStrikethroughSpan, this._emitGfmStrikethroughSpan);
            default:
                throw new Error(`Not implemented: ${node.kind} (${(node.constructor as any).name})`);
        }
    }

    private _isSafeTag(tagName: string): boolean {
        return !this._tagFilter || this._tagFilter.call(undefined, tagName);
    }

    public toString(): string {
        return this._buffer;
    }
}
