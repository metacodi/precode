import ts from 'typescript';
export interface TextReplacement {
    start: number;
    end: number;
    text: string;
    priority?: number;
}
export declare class TypescriptParser {
    fullName: string;
    content: string;
    source: ts.SourceFile;
    replacements: TextReplacement[];
    static parse(fullName: string, content?: string): ts.SourceFile;
    static find(nodes: any, filter: ts.SyntaxKind | ts.SyntaxKind[] | ((node: ts.Node | ts.Statement) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): ts.Node;
    static filter(nodes: any, filter: ts.SyntaxKind | ts.SyntaxKind[] | ((node: ts.Node | ts.Statement) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): ts.Node[];
    constructor(fullName: string, content?: string);
    replaceProperty(propertyPath: string, value: string | number | boolean | null | RegExp): void;
    findIdentifier(name: string, parent: ts.Node, indent?: string): ts.Node;
    hasIdentifierChild(name: string, parent: ts.Node, indent?: string): boolean;
    getNodes(parent: ts.Node): ts.Node[];
    save(): void;
}
//# sourceMappingURL=typescript-parser.d.ts.map