import ts from 'typescript';
export declare class TypescriptParser {
    constructor();
    static parse(fullName: string, content?: string): ts.SourceFile;
    static find(nodes: any, filter: ts.SyntaxKind | ts.SyntaxKind[] | ((node: ts.Node | ts.Statement) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): ts.Node;
    static filter(nodes: any, filter: ts.SyntaxKind | ts.SyntaxKind[] | ((node: ts.Node | ts.Statement) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): ts.Node[];
    foo(): string;
}
//# sourceMappingURL=typescript-parser.d.ts.map