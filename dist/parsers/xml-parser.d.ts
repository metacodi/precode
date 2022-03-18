import { XMLDocument, XMLAstNode, XMLElement, XMLAttribute } from '@xml-tools/ast';
import { TextReplacement } from './types';
export declare class XmlParser {
    fullName: string;
    content: string;
    document: XMLDocument;
    replacements: TextReplacement[];
    static parse(fullName: string, content?: string): XMLDocument;
    static find(nodes: any, match: string | string[] | ((node: any) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): any;
    static filter(nodes: any, match: string | string[] | ((node: any) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): any[];
    constructor(fullName: string, content?: string);
    find(nodes: any, match: string | string[] | ((node: any) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): any;
    filter(nodes: any, match: string | string[] | ((node: any) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): any;
    resolvePath(path: string): XMLElement | XMLAttribute;
    private parsePathSegment;
    replaceName(node: string | XMLAstNode, text: string): void;
    replaceValue(node: string | XMLAstNode, text: string): void;
    replaceNode(node: string | XMLAstNode, text: string): void;
    save(): void;
}
//# sourceMappingURL=xml-parser.d.ts.map