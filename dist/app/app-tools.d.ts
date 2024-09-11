import { FtpClient } from "@metacodi/node-utils";
import * as mysql from 'mysql2';
import { PoolConnection, Pool } from 'mysql2/promise';
import { PrimitiveType, TypescriptParser } from "../parsers/typescript-parser";
import { AppApiClient } from "./app-api-client";
export interface AppToolsOptions {
    apps: string;
    dataIdentifier?: string;
    frontendFolder: string;
    api?: AppApiClient;
}
export declare class AppTools {
    options: AppToolsOptions;
    constructor(options: AppToolsOptions);
    get api(): AppApiClient;
    get apps(): string;
    get dataIdentifier(): string;
    get frontendFolder(): string;
    getCustomerData(customer: string): {
        parser: TypescriptParser;
        data: (path: string) => PrimitiveType;
    };
    getCurrentCustomer(env: string): string;
    getCurrentAppId(env: string): string;
    findCustomerFolder(appId: string): string;
    getAllCustomers(): string[];
    getCustomerVersion(customer: string, env: string): string;
    getCustomerFtpClient(customer: string, options?: {
        ftpVar?: string;
    }): {
        remotePath: string;
        ftp: FtpClient;
    };
    getPendingChanges(env: string, side: 'backend' | 'frontend' | undefined): Promise<{
        filename: string;
        status: string;
    }[]>;
    pools: {
        [customer_env: string]: mysql.Pool;
    };
    getPersistentConnection(customer: string, env: string): Promise<PoolConnection>;
    getConnection(customer: string, env: string): Promise<Pool>;
    closeConnections(): void;
    executeQueries(queries: string[], env: string, options?: {
        customers?: string[];
        verbose?: boolean;
    }): Promise<void>;
    syncTableChanges(table: string, fromEnv: string, toEnv: string, fromCustomer?: string, toCustomers?: string[]): Promise<void>;
    getCustomerTableLastUpdate(customer: string, env: string, table: string): Promise<string>;
}
//# sourceMappingURL=app-tools.d.ts.map