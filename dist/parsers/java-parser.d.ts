export declare class JavaParser {
    constructor();
    foo(): string;
    static parse(fullName: string, content?: string): any;
    static find(nodes: any, match: string | string[] | ((node: any) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): any;
    static filter(nodes: any, match: string | string[] | ((node: any) => boolean), options?: {
        recursive?: boolean;
        firstOnly?: boolean;
    }): any[];
}
//# sourceMappingURL=java-parser.d.ts.map