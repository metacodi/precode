import ts from 'typescript';
import { TextReplacement } from './types';
export type PrimitiveType = BasicPrimitiveType | ComplexPrimitiveType;
export type BasicPrimitiveType = string | number | boolean | null | RegExp;
export type ComplexPrimitiveType = object | Array<PrimitiveType>;
export type EmptyPrimitiveType = undefined | never | unknown | void;
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
    static getNodes(parent: ts.Node): ts.Node[];
    constructor(fullName: string, content?: string);
    save(): void;
    getImportDeclarations(): ts.ImportDeclaration[];
    getImportClauseNames(node: ts.ImportDeclaration): any[];
    getPropertyValue(propertyPathOrAssignment: string | ts.PropertyAssignment): PrimitiveType;
    setPropertyValue(propertyPathOrAssignment: string | ts.PropertyAssignment, value: PrimitiveType): void;
    removeProperty(propertyPathOrAssignment: string | ts.PropertyAssignment): void;
    private stringifyPrimitiveType;
    parsePropertyInitializer(value: ts.Expression): PrimitiveType;
    parseArrayLiteralExpression(value: ts.ArrayLiteralExpression): PrimitiveType[];
    parseObjectLiteralExpression(value: ts.ObjectLiteralExpression): object;
    parsePropertyAccessExpression(value: ts.PropertyAccessExpression): any;
    resolvePropertyPath(propertyPath: string): ts.PropertyAssignment | ts.VariableDeclaration;
    existsPropertyPath(propertyPath: string): boolean;
    findClassDeclaration(name: string, parent?: ts.Node): ts.ClassDeclaration;
    findIdentifier(name: string, parent?: ts.Node, indent?: string): ts.Node;
    find(filter: ts.SyntaxKind | ts.SyntaxKind[] | ((node: ts.Node | ts.Statement) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
        parent?: ts.Node;
    }): ts.Node;
    filter(filter: ts.SyntaxKind | ts.SyntaxKind[] | ((node: ts.Node | ts.Statement) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
        parent?: ts.Node;
    }): ts.Node[];
    insertBefore(node: ts.Node, text: string): void;
    insertAfter(node: ts.Node, text: string): void;
}
//# sourceMappingURL=typescript-parser.d.ts.map