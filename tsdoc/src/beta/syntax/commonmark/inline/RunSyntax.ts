import { NamespaceUtils } from "../../../utils/NamespaceUtils";
import { IInlineSyntax } from "../../IInlineSyntax";
import { InlineParser } from "../../../parser/InlineParser";
import { Inline } from "../../../nodes/Inline";
import { IHtmlEmittable } from "../../IHtmlEmittable";
import { Run } from "../../../nodes/Run";
import { HtmlWriter } from "../../../emitters/HtmlWriter";
import { ITSDocEmittable } from "../../ITSDocEmittable";
import { TSDocWriter } from "../../../emitters/TSDocWriter";

export namespace RunSyntax {
    // The following ensures we are properly implementing the interface.
    /*@__PURE__*/ NamespaceUtils.implementsType<
        & IInlineSyntax
        & IHtmlEmittable<Run>
        & ITSDocEmittable<Run>
    >(RunSyntax);

    export function tryParseInline(parser: InlineParser): Inline | undefined {
        // Runs cannot be parsed, but are instead created by the InlineParser for unhandled
        // text
        return undefined;
    }

    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitHtml(writer: HtmlWriter, node: Run): void {
        writer.write(node.text);
    }

    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    export function emitTSDoc(writer: TSDocWriter, node: Run): void {
        writer.writeEscaped(node.text);
    }
}