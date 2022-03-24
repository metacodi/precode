export declare type FilterPatternType = string | RegExp | ((text: string) => boolean) | {
    test: RegExp | ((text: string) => boolean);
};
export declare function applyFilterPattern(text: string, pattern?: FilterPatternType): boolean;
export declare function capitalize(text: string): string;
//# sourceMappingURL=functions.d.ts.map