export const enum DocumentPosition {
    /**
     * Indicates the provided node is the same as this node.
     */
    Same,
    /**
     * Indicates the nodes do not belong to the same document hierarchy.
     */
    Unrelated,
    /**
     * Indicates the provided node precedes (and does not contain) this node in the document hierarchy.
     */
    Preceding,
    /**
     * Indicates the provided node follows (and is not contained by) this node in the document hierarchy.
     */
    Following,
    /**
     * Indicates the provided node contains (and therefore also precedes) this node in the document hierarchy.
     */
    Contains,
    /**
     * Indicates the provided node is contained by (and therefore also follows) this node in the document hierarchy.
     */
    ContainedBy,
}