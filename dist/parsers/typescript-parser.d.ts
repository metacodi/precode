import ts from 'typescript';
import { TextReplacement } from './types';
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
    getPropertyValue(propertyPath: string): string | number | boolean | null | RegExp;
    replaceProperty(propertyPath: string, value: string | number | boolean | null | RegExp): void;
    parsePropertyInitializer(value: ts.Expression): number | string | boolean | null | RegExp;
    resolvePropertyPath(propertyPath: string): ts.PropertyAssignment;
    findIdentifier(name: string, parent?: ts.Node, indent?: string): ts.Node;
    hasIdentifierChild(name: string, parent: ts.Node, indent?: string): boolean;
    getNodes(parent: ts.Node): ts.Node[];
    insertBefore(node: ts.Node, text: string): void;
    insertAfter(node: ts.Node, text: string): void;
    save(): void;
}
//# sourceMappingURL=typescript-parser.d.ts.map