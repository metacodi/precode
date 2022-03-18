import { TerminalRunOptions } from './terminal';
export declare class Git {
    constructor();
    static hasChanges(options?: {
        folder?: string;
        filter?: string;
        verbose?: boolean;
    }): Promise<boolean>;
    static getChanges(options?: {
        folder?: string;
        filter?: string;
        verbose?: boolean;
    }): Promise<{
        filename: string;
        status: string;
    }[]>;
    static discardChanges(resource?: string): Promise<any>;
    static publish(options?: {
        folder?: string;
        commit?: string;
        branch?: string;
        run?: TerminalRunOptions;
    }): Promise<boolean>;
    static codeToStatus(code: string): string;
    foo(): string;
}
//# sourceMappingURL=git.d.ts.map