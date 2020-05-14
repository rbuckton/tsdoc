import { IBlockSyntax } from "./IBlockSyntax";
import { Block } from "../nodes/Block";
import { IInlineSyntax } from "./IInlineSyntax";
import { IHtmlEmittable } from "./IHtmlEmittable";
import { ITSDocEmittable } from "./ITSDocEmittable";
import { ISyntaxElementSyntax } from "./ISyntaxElementSyntax";
import { SyntaxElement } from "../nodes/SyntaxElement";
import { Inline } from "../nodes/Inline";
import { Node } from "../nodes/Node";

export type SyntaxDefinition =
    | IBlockSyntax<Block> & Partial<IHtmlEmittable<Block>> & Partial<ITSDocEmittable<Block>>
    | IInlineSyntax & Partial<IHtmlEmittable<Inline>> & Partial<ITSDocEmittable<Inline>>
    | ISyntaxElementSyntax<SyntaxElement> & Partial<IHtmlEmittable<SyntaxElement>> & Partial<ITSDocEmittable<SyntaxElement>>
    | IHtmlEmittable<Node>
    | ITSDocEmittable<Node>
    ;