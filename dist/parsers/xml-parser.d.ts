import { XMLDocument } from '@xml-tools/ast';
export declare class XmlParser {
    static parse(fullName: string, content?: string): XMLDocument;
    static find(nodes: any, match: string | string[] | ((node: any) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): any;
    static filter(nodes: any, match: string | string[] | ((node: any) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): any[];
}
//# sourceMappingURL=xml-parser.d.ts.map