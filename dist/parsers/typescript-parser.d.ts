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
    getPropertyValue(propertyPath: string): PrimitiveType;
    replaceProperty(propertyPath: string, value: PrimitiveType): void;
    private getValueText;
    parsePropertyInitializer(value: ts.Expression): PrimitiveType;
    parseArrayLiteralExpression(value: ts.ArrayLiteralExpression): PrimitiveType[];
    parseObjectLiteralExpression(value: ts.ObjectLiteralExpression): object;
    resolvePropertyPath(propertyPath: string): ts.PropertyAssignment;
    existsPropertyPath(propertyPath: string): boolean;
    findIdentifier(name: string, parent?: ts.Node, indent?: string): ts.Node;
    hasIdentifierChild(name: string, parent: ts.Node, indent?: string): boolean;
    getNodes(parent: ts.Node): ts.Node[];
    insertBefore(node: ts.Node, text: string): void;
    insertAfter(node: ts.Node, text: string): void;
    save(): void;
}
//# sourceMappingURL=typescript-parser.d.ts.map