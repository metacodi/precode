import ts from 'typescript';
export interface TextReplacement {
    start: number;
    end: number;
    text: string;
    priority?: number;
}
export declare class TextReplacer {
    content: string;
    replacements: TextReplacement[];
    constructor(content?: string);
    insert(pos: number, text: string, priority?: number): TextReplacement;
    insertAfter(node: ts.Node | ts.NodeArray<ts.Node> | ts.Statement, text: string, priority?: number): TextReplacement;
    insertBefore(node: ts.Node | ts.NodeArray<ts.Node> | ts.Statement, text: string, priority?: number): TextReplacement;
    replace(start: number, end: number, text: string, priority?: number): TextReplacement;
    replaceNode(node: ts.Node | ts.NodeArray<ts.Node> | ts.Statement, text: string, priority?: number): TextReplacement;
    delete(start: number, end: number, priority?: number): TextReplacement;
    deleteNode(node: ts.Node | ts.NodeArray<ts.Node> | ts.Statement, priority?: number): TextReplacement;
    apply(content?: string): string;
}
//# sourceMappingURL=text-replacer.d.ts.map