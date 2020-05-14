import { Node } from "../nodes/Node";
import { HtmlWriter } from "../emitters/HtmlWriter";

export interface IHtmlEmittable<T extends Node> {
    /**
     * Emits a node as HTML.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    emitHtml(writer: HtmlWriter, node: T): void;
}