import { XMLDocument, XMLElement, XMLAttribute, XMLTextContent } from '@xml-tools/ast';
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
    }): any[];
    resolvePath(path: string, options?: {
        parent?: XMLElement;
    }): XMLElement | XMLAttribute | XMLTextContent;
    private parsePathSegment;
    replaceName(node: string | XMLElement | XMLAttribute | XMLTextContent, text: string): void;
    replaceValue(node: string | XMLElement | XMLAttribute | XMLTextContent, text: string): void;
    replaceNode(node: string | XMLElement | XMLAttribute | XMLTextContent, text: string): void;
    save(): void;
}
//# sourceMappingURL=xml-parser.d.ts.map