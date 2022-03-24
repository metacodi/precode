import { Program, Node } from 'php-parser';
export declare class PhpParser {
    static parse(fullName: string, content?: string): Program;
    static find(nodes: any, filter: string | string[] | ((node: Node | Program) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): Node;
    static filter(nodes: any, filter: string | string[] | ((node: Node | Program) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): Node[];
}
//# sourceMappingURL=php-parser.d.ts.map