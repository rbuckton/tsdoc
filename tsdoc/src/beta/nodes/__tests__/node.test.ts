import { Document } from "../Document"
import { MarkdownParagraph } from "../MarkdownParagraph";
import { Run } from "../Run";
import { DocumentPosition } from "../Node";

describe('compareDocumentPositions', () => {
    it('contained by', () => {
        const doc: Document = new Document();
        const para: MarkdownParagraph = new MarkdownParagraph();
        const run: Run = new Run();
        doc.appendChild(para);
        para.appendChild(run);
        expect(para.compareDocumentPosition(run)).toBe(DocumentPosition.ContainedBy);
        expect(doc.compareDocumentPosition(run)).toBe(DocumentPosition.ContainedBy);
        expect(doc.compareDocumentPosition(para)).toBe(DocumentPosition.ContainedBy);
    });
    it('contains', () => {
        const doc: Document = new Document();
        const para: MarkdownParagraph = new MarkdownParagraph();
        const run: Run = new Run();
        doc.appendChild(para);
        para.appendChild(run);
        expect(run.compareDocumentPosition(para)).toBe(DocumentPosition.Contains);
        expect(run.compareDocumentPosition(doc)).toBe(DocumentPosition.Contains);
        expect(para.compareDocumentPosition(doc)).toBe(DocumentPosition.Contains);
    });
    it('following', () => {
        const doc: Document = new Document();
        const p1: MarkdownParagraph = new MarkdownParagraph();
        const p2: MarkdownParagraph = new MarkdownParagraph();
        const r1: Run = new Run();
        const r2: Run = new Run();
        doc.appendChild(p1);
        doc.appendChild(p2);
        p1.appendChild(r1);
        p2.appendChild(r2);
        expect(r1.compareDocumentPosition(r2)).toBe(DocumentPosition.Following);
        expect(r1.compareDocumentPosition(p2)).toBe(DocumentPosition.Following);
        expect(p1.compareDocumentPosition(p2)).toBe(DocumentPosition.Following);
        expect(p1.compareDocumentPosition(r2)).toBe(DocumentPosition.Following);
    });
    it('preceding', () => {
        const doc: Document = new Document();
        const p1: MarkdownParagraph = new MarkdownParagraph();
        const p2: MarkdownParagraph = new MarkdownParagraph();
        const r1: Run = new Run();
        const r2: Run = new Run();
        doc.appendChild(p1);
        doc.appendChild(p2);
        p1.appendChild(r1);
        p2.appendChild(r2);
        expect(r2.compareDocumentPosition(r1)).toBe(DocumentPosition.Preceding);
        expect(r2.compareDocumentPosition(p1)).toBe(DocumentPosition.Preceding);
        expect(p2.compareDocumentPosition(r1)).toBe(DocumentPosition.Preceding);
        expect(p2.compareDocumentPosition(p1)).toBe(DocumentPosition.Preceding);
    });
    it('same', () => {
        const doc: Document = new Document();
        const para: MarkdownParagraph = new MarkdownParagraph();
        const run: Run = new Run();
        doc.appendChild(para);
        para.appendChild(run);
        expect(run.compareDocumentPosition(run)).toBe(DocumentPosition.Same);
        expect(para.compareDocumentPosition(para)).toBe(DocumentPosition.Same);
        expect(doc.compareDocumentPosition(doc)).toBe(DocumentPosition.Same);
    });
    it('unrelated', () => {
        const doc: Document = new Document();
        const para: MarkdownParagraph = new MarkdownParagraph();
        const run: Run = new Run();
        doc.appendChild(para);
        expect(run.compareDocumentPosition(para)).toBe(DocumentPosition.Unrelated);
        expect(run.compareDocumentPosition(doc)).toBe(DocumentPosition.Unrelated);
        expect(para.compareDocumentPosition(run)).toBe(DocumentPosition.Unrelated);
        expect(doc.compareDocumentPosition(run)).toBe(DocumentPosition.Unrelated);
    });
});