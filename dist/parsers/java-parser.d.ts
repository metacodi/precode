import { ParseTree } from 'java-ast';
import { TextReplacement } from './types';
export declare class JavaParser {
    fullName: string;
    content: string;
    document: ParseTree;
    replacements: TextReplacement[];
    static parse(fullName: string, content?: string): any;
    static find(nodes: any, match: string | string[] | ((node: any) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): any;
    static filter(nodes: any, match: string | string[] | ((node: any) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): any[];
    constructor(fullName: string, content?: string);
    save(): void;
}
//# sourceMappingURL=java-parser.d.ts.map