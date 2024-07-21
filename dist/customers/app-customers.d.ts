import { FtpClient } from "@metacodi/node-utils";
import * as mysql from 'mysql2';
import { PoolConnection, Pool } from 'mysql2/promise';
import { PrimitiveType, TypescriptParser } from "../parsers/typescript-parser";
import { AppCustomersOptions } from "./app-customers.types";
export declare class AppCustomers {
    options: AppCustomersOptions;
    constructor(options: AppCustomersOptions);
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
    getPersistentConnecion(customer: string, env: string): Promise<PoolConnection>;
    getConnecion(customer: string, env: string): Promise<Pool>;
    closeConnections(): void;
    executeQueries(queries: string[], env: string, options?: {
        customers?: string[];
        verbose?: boolean;
    }): Promise<void>;
}
//# sourceMappingURL=app-customers.d.ts.map