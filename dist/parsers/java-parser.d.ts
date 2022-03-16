export declare class JavaParser {
    constructor();
    static parse(fullName: string, content?: string): any;
    static find(nodes: any, match: string | string[] | ((node: any) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): any;
    static filter(nodes: any, match: string | string[] | ((node: any) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): any[];
    foo(): string;
}
//# sourceMappingURL=java-parser.d.ts.map