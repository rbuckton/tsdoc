import { Node } from "../../../nodes/Node";
import { SyntaxKind } from "../../../nodes/SyntaxKind";
import { MarkdownCodeBlock } from "../../../nodes/MarkdownCodeBlock";
import { Run } from "../../../nodes/Run";
import { MarkdownList } from "../../../nodes/MarkdownList";
import { ListMarker } from "../../../nodes/ListItemBase";
import { MarkdownParagraph } from "../../../nodes/MarkdownParagraph";
import { MarkdownHeading } from "../../../nodes/MarkdownHeading";
import { MarkdownCodeSpan } from "../../../nodes/MarkdownCodeSpan";
import { MarkdownLink } from "../../../nodes/MarkdownLink";
import { MarkdownEmSpan } from "../../../nodes/MarkdownEmSpan";
import { MarkdownThematicBreak } from "../../../nodes/MarkdownThematicBreak";
import { MarkdownImage } from "../../../nodes/MarkdownImage";
import { MarkdownBlockQuote } from "../../../nodes/MarkdownBlockQuote";
import { MarkdownListItem } from "../../../nodes/MarkdownListItem";
import { MarkdownHtmlInline } from "../../../nodes/MarkdownHtmlInline";
import { MarkdownHtmlBlock } from "../../../nodes/MarkdownHtmlBlock";

// emulates the commonmark renderer for tests

export function render(node: Node): string {
    let buffer: string = '';
    let lastOut: string = '\n';
    let disableTags: number = 0;

    function lit(str: string): void {
        buffer += str;
        lastOut = str;
    }

    function cr(): void {
        if (lastOut !== '\n') {
            lit('\n');
        }
    }

    function out(str: string): void {
        lit(esc(str));
    }

    function esc(str: string): string {
        return str.replace(/[&<>"]/g, ch =>
            ch === '&' ? '&amp;' :
            ch === '<' ? '&lt;' :
            ch === '>' ? '&gt;' :
            ch === '"' ? '&quot;' :
            ch);
    }

    function tag(name: string, attrs?: [string, string][], selfclosing?: boolean): void {
        if (disableTags > 0) return;
        buffer += '<' + name;
        if (attrs && attrs.length) {
            for (const [key, value] of attrs) {
                buffer += ' ' + key + '="' + value + '"';
            }
        }
        if (selfclosing) {
            buffer += ' /';
        }
        buffer += '>';
        lastOut = '>';
    }

    function text(node: Run): void {
        out(node.text);
    }

    function softbreak(): void {
        lit('\n');
    }

    function linebreak(): void {
        tag('br', [], true);
        cr();
    }

    function link(node: MarkdownLink, entering: boolean): void {
        const attrs: [string, string][] = [];
        if (entering) {
            attrs.push(['href', esc(node.destination)]);
            if (node.title) {
                attrs.push(['title', esc(node.title)]);
            }
            tag('a', attrs);
        } else {
            tag('/a');
        }
    }

    function image(node: MarkdownImage, entering: boolean): void {
        if (entering) {
            if (disableTags === 0) {
                lit('<img src="' + esc(node.destination) + '" alt="');
            }
            disableTags++;
        } else {
            disableTags--;
            if (disableTags === 0) {
                if (node.title) {
                    lit('" title="' + esc(node.title));
                }
                lit('" />');
            }
        }
    }

    function emph(node: MarkdownEmSpan, entering: boolean): void {
        tag(entering ? 'em' : '/em');
    }

    function strong(node: MarkdownEmSpan, entering: boolean): void {
        tag(entering ? 'strong' : '/strong');
    }

    function paragraph(node: MarkdownParagraph, entering: boolean): void {
        const parent: Node = node.parent!;
        if (parent && parent.isListItem() && parent.listMarker.tight) {
            return;
        }
        if (entering) {
            cr();
            tag('p');
        } else {
            tag('/p');
            cr();
        }
    }

    function heading(node: MarkdownHeading, entering: boolean): void {
        const tagname: string = `h${node.level}`;
        if (entering) {
            cr();
            tag(tagname);
        } else {
            tag(`/${tagname}`);
            cr();
        }
    }

    function code(node: MarkdownCodeSpan): void {
        tag('code');
        out(node.text);
        tag('/code');
    }

    function code_block(node: MarkdownCodeBlock): void {
        const info_words: string[] | undefined = node.info ? node.info.split(/\s+/) : [];
        const attrs: [string, string][] = [];
        if (info_words.length > 0 && info_words[0].length > 0) {
            attrs.push(['class', 'language-' + esc(info_words[0])]);
        }
        cr();
        tag('pre');
        tag('code', attrs);
        out(node.literal);
        tag('/code');
        tag('/pre');
        cr();
    }

    function thematic_break(node: MarkdownThematicBreak): void {
        cr();
        tag('hr', [], true);
        cr();
    }

    function block_quote(node: MarkdownBlockQuote, entering: boolean) {
        cr();
        tag(entering ? 'blockquote' : '/blockquote');
        cr();
    }

    function list(node: MarkdownList, entering: boolean) {
        const listMarker: ListMarker | undefined = node.firstChildListItem ? node.firstChildListItem.listMarker as ListMarker : undefined;
        const tagname: string = listMarker && listMarker.ordered ? 'ol' : 'ul';
        const attrs: [string, string][] = [];

        if (entering) {
            const start: number | undefined = listMarker && listMarker.ordered ? listMarker.start : undefined;
            if (start !== undefined && start !== 1) {
                attrs.push(['start', start.toString()]);
            }
            cr();
            tag(tagname, attrs);
            cr();
        } else {
            cr();
            tag('/' + tagname);
            cr();
        }
    }

    function item(node: MarkdownListItem, entering: boolean) {
        if (entering) {
            tag('li');
        } else {
            tag('/li');
            cr();
        }
    }

    function html_inline(node: MarkdownHtmlInline) {
        lit(node.html);
    }

    function html_block(node: MarkdownHtmlBlock) {
        cr();
        lit(node.literal);
        cr();
    }

    function emit(node: Node) {
        switch (node.kind) {
            case SyntaxKind.Document:
                if (node.isContent()) node.forEachChild(emit);
                break;
            // case SyntaxKind.DocTagName:
            //     break;
            // case SyntaxKind.DocBlockTag:
            //     break;
            // case SyntaxKind.DocParamTag:
            //     break;
            // case SyntaxKind.DocInlineTag:
            //     break;
            // case SyntaxKind.DocLinkTag:
            //     break;
            // case SyntaxKind.DocInheritDocTag:
            //     break;
            // case SyntaxKind.HtmlElement:
            // case SyntaxKind.HtmlSelfClosingElement:
            // case SyntaxKind.HtmlOpeningElement:
            // case SyntaxKind.HtmlClosingElement:
            // case SyntaxKind.HtmlCData:
            // case SyntaxKind.HtmlDocType:
            // case SyntaxKind.HtmlAttribute:
            //     break;
            case SyntaxKind.MarkdownThematicBreak:
                thematic_break(node as MarkdownThematicBreak);
                break;
            case SyntaxKind.MarkdownHeading:
                heading(node as MarkdownHeading, true);
                if (node.isContent()) node.forEachChild(emit);
                heading(node as MarkdownHeading, false);
                break;
            case SyntaxKind.MarkdownCodeBlock:
                code_block(node as MarkdownCodeBlock);
                break;
            case SyntaxKind.MarkdownLinkReference:
                break;
            case SyntaxKind.MarkdownHtmlBlock:
                html_block(node as MarkdownHtmlBlock);
                break;
            case SyntaxKind.MarkdownParagraph:
                paragraph(node as MarkdownParagraph, true);
                if (node.isContent()) node.forEachChild(emit);
                paragraph(node as MarkdownParagraph, false);
                break;
            case SyntaxKind.MarkdownBlockQuote:
                block_quote(node as MarkdownBlockQuote, true);
                if (node.isContent()) node.forEachChild(emit);
                block_quote(node as MarkdownBlockQuote, false);
                break;
            case SyntaxKind.MarkdownList:
                list(node as MarkdownList, true);
                if (node.isContent()) node.forEachChild(emit);
                list(node as MarkdownList, false);
                break;
            case SyntaxKind.MarkdownListItem:
                item(node as MarkdownListItem, true);
                if (node.isContent()) node.forEachChild(emit);
                item(node as MarkdownListItem, false);
                break;
            case SyntaxKind.MarkdownCodeSpan:
                code(node as MarkdownCodeSpan);
                break;
            case SyntaxKind.MarkdownEmSpan:
                emph(node as MarkdownEmSpan, true);
                if (node.isContent()) node.forEachChild(emit);
                emph(node as MarkdownEmSpan, false);
                break;
            case SyntaxKind.MarkdownStrongSpan:
                strong(node as MarkdownEmSpan, true);
                if (node.isContent()) node.forEachChild(emit);
                strong(node as MarkdownEmSpan, false);
                break;
            case SyntaxKind.MarkdownLink:
                link(node as MarkdownLink, true);
                if (node.isContent()) node.forEachChild(emit);
                link(node as MarkdownLink, false);
                break;
            case SyntaxKind.MarkdownImage:
                image(node as MarkdownImage, true);
                if (node.isContent()) node.forEachChild(emit);
                image(node as MarkdownImage, false);
                break;
            case SyntaxKind.MarkdownHtmlInline:
                html_inline(node as MarkdownHtmlInline);
                break;
            case SyntaxKind.MarkdownHardBreak:
                linebreak();
                break;
            case SyntaxKind.MarkdownSoftBreak:
                softbreak();
                return;
            // case SyntaxKind.MarkdownLinkLabel:
            //     break;
            // case SyntaxKind.MarkdownLinkDestination:
            //     break;
            // case SyntaxKind.MarkdownLinkTitle:
            //     break;
            case SyntaxKind.Run:
                text(node as Run);
                break;
            default:
                throw new Error(`Not implemented: ${node.kind} (${(node.constructor as any).name})`);
        }
    }
    emit(node);
    return buffer;
}
