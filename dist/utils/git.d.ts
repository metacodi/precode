import { TerminalRunOptions } from './terminal';
export declare class Git {
    constructor();
    foo(): string;
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
    static publish(options?: {
        folder?: string;
        commit?: string;
        branch?: string;
        run?: TerminalRunOptions;
    }): Promise<boolean>;
    static codeToStatus(code: string): string;
}
//# sourceMappingURL=git.d.ts.map