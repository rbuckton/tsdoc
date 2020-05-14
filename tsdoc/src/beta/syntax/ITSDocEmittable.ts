import { Node } from "../nodes/Node";
import { TSDocWriter } from "../emitters/TSDocWriter";

export interface ITSDocEmittable<T extends Node> {
    /**
     * Emits a node as TSDoc.
     * @param writer The writer used to write the node.
     * @param node The node to write.
     */
    emitTSDoc(writer: TSDocWriter, node: T): void;
}