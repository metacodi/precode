import Client from 'ftp';
export declare class FtpClient {
    protected ftp: Client;
    protected options: Client.Options;
    protected isReady: boolean;
    constructor(options?: Client.Options);
    connect(connection?: Client.Options): void;
    disconnect(): void;
    ready(): Promise<boolean>;
    get status(): Promise<string>;
    get host(): string;
    get user(): string;
    get password(): string;
    get port(): number;
    get defaultOptions(): Partial<Client.Options>;
    upload(local: string, remote: string, options?: {
        continueOnError?: boolean;
        verbose?: boolean;
    }): Promise<void>;
    private uploadAll;
    remove(remote: string, options?: {
        continueOnError?: boolean;
        verbose?: boolean;
    }): Promise<void>;
    private removeAll;
    mkdir(remote: string, recursive?: boolean): Promise<boolean>;
    rmdir(remote: string, recursive: boolean, options?: {
        continueOnError?: boolean;
    }): Promise<boolean>;
    put(local: string, remote: string): Promise<boolean>;
    delete(remote: string): Promise<boolean>;
    list(remote?: string): Promise<Client.ListingElement[]>;
    pwd(): Promise<string>;
    normalize(resource: string): string;
    isDirectory(resource: string): boolean;
    isFile(resource: string): boolean;
    protected verbose(text: string): void;
}
//# sourceMappingURL=ftp.d.ts.map