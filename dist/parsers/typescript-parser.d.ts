import ts from 'typescript';
import { TextReplacement } from './types';
export declare type PrimitiveType = BasicPrimitiveType | ComplexPrimitiveType;
export declare type BasicPrimitiveType = string | number | boolean | null | RegExp;
export declare type ComplexPrimitiveType = object | Array<PrimitiveType>;
export declare type EmptyPrimitiveType = undefined | never | unknown | void;
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
    getPropertyValue(propertyPathOrAssignment: string | ts.PropertyAssignment): PrimitiveType;
    setPropertyValue(propertyPathOrAssignment: string | ts.PropertyAssignment, value: PrimitiveType): void;
    removeProperty(propertyPathOrAssignment: string | ts.PropertyAssignment): void;
    private getValueText;
    parsePropertyInitializer(value: ts.Expression): PrimitiveType;
    parseArrayLiteralExpression(value: ts.ArrayLiteralExpression): PrimitiveType[];
    parseObjectLiteralExpression(value: ts.ObjectLiteralExpression): object;
    resolvePropertyPath(propertyPath: string): ts.PropertyAssignment;
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
    getNodes(parent: ts.Node): ts.Node[];
    insertBefore(node: ts.Node, text: string): void;
    insertAfter(node: ts.Node, text: string): void;
    save(): void;
}
//# sourceMappingURL=typescript-parser.d.ts.map