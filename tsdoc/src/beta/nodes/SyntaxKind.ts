export type SyntaxKindLike = 
    | SyntaxKind
    | symbol
    ;

export enum SyntaxKind {
    Unknown,

    Text,

    // TSDoc
    Document,
    DocTagName,                         // @tagName
    DocBlockTag,                        // @tagName ...
    DocParamTag,                        // @param ...
    DocInlineTag,                       // {@tagName}
    DocLinkTag,                         // {@link url|alt}
    DocInheritDocTag,                   // {@inheritDoc namepath}

    // HTML
    HtmlElement,                        // <html></html>
    HtmlSelfClosingElement,             // <img />
    HtmlOpeningElement,                 // <html>
    HtmlClosingElement,                 // </html>
    HtmlCData,                          // <![CDATA[]]>
    HtmlDocType,                        // <!DOCTYPE>
    HtmlAttribute,                      // hidden (or) src="foo.jpg"

    // Markdown
    // - Leaf Blocks
    MarkdownThematicBreak,              // *** (or) --- (or) ___
    MarkdownHeading,                    // # Heading (or) Heading\n--- (or) Heading\n===
    MarkdownCodeBlock,                  //     code (or) ```lang\ncode\n``` (or) ~~~lang\ncode\n~~~
    MarkdownLinkReference,              // [foo]: /url "title"
    MarkdownHtmlBlock,                  // <html></html>
    MarkdownParagraph,                  // words\nwords\n\n
    GfmTable,
    GfmTableRow,
    GfmTableCell,
    // - Container Blocks
    MarkdownBlockQuote,                 // > words
    MarkdownListItem,                   // - item (or) * item (or) 1. item (or) 1) item
    MarkdownList,                       // - item\n- item (or) 1. item\n1. item
    GfmTaskListItem,                    // - [ ] foo (or) - [x] foo (or) * [ ] foo (or) * [x] foo
    GfmTaskList,                        // - [ ] item\n- [x] item
    // - Inlines
    MarkdownCodeSpan,                   // `a` (or) `` a ``
    MarkdownEmSpan,                     // *a* (or) _a_
    MarkdownStrongSpan,                 // **a** (or) __a__
    MarkdownLink,                       // [text](/url "title") (or) [label] (or) [label][] (or) [text][label] (or) <http://foo.bar> (or) <foo@bar.com>
    MarkdownImage,                      // ![alt](/url "title") (or) ![label] (or) ![label][] (or) ![text][label]
    MarkdownHtmlInline,                 // <img> (or) <b>
    MarkdownHardBreak,                  // words  \nmore words (or) words\\nmore words
    MarkdownSoftBreak,                  // words\nmore words
    GfmStrikethroughSpan,               // ~~a~~
    // - Elements
    MarkdownLinkLabel,                  // [label]
    MarkdownLinkDestination,            // /url
    MarkdownLinkTitle,                  // "title",

    // Other Inlines
    Run,
}