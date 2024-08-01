#!/usr/bin/env node
/// <reference types="node" />
import { Server as HttpServer } from 'http';
import ts from 'typescript';
import { ApiClient, ApiClientOptions, ApiRequestOptions, HttpMethod } from '@metacodi/node-api-client';
import { ResourceType } from '@metacodi/node-utils';
import { ApiEntityFieldSchema, ApiEntitySchema } from './api-entity-schema';
import { TypescriptParser } from '../parsers/typescript-parser';
export interface AppApiOptions extends ApiClientOptions {
    httpServer: HttpServer;
    apiBaseUrl: string;
    apiIdUser: number;
}
export declare class AppApiClient extends ApiClient {
    options: AppApiOptions;
    constructor(options: AppApiOptions);
    baseUrl(): string;
    protected getAuthHeaders(method: HttpMethod, endpoint: string, params: any): Promise<{
        Authorization: string;
        'Authorization-User': number;
    }>;
    request(method: HttpMethod, endpoint: string, options?: ApiRequestOptions): Promise<any>;
    processSchemasFromFolder(folder: string, options?: {
        verbose?: boolean;
        commented?: boolean;
    }): Promise<void>;
    processSchemaFile(file: ResourceType, options?: {
        folderRelativeTo?: string;
        verbose?: boolean;
        commented?: boolean;
    }): Promise<{
        interfaces: {
            name: string;
            content: string;
        }[];
        errors: {
            file: ResourceType;
            interfaceName: string;
            message: any;
        }[];
    }>;
    protected processEntity(entityName: string, backendName: string, schemaName: string, entity: ts.PropertyAssignment, parser: TypescriptParser, file: ResourceType, options?: {
        verbose?: boolean;
        commented?: boolean;
    }): Promise<{
        name: string;
        content: string;
    }>;
    protected buildSchemaQuery(entity: ts.PropertyAssignment, parser: TypescriptParser, file: ResourceType): {
        fields: string | number | true | object;
        relations: string | number | true | object;
        params: string;
    };
    protected generateSchema(entity: ts.PropertyAssignment, parser: TypescriptParser, schema: ApiEntitySchema): ApiEntitySchema;
    protected stringifySchema(entity: ApiEntitySchema, name: string, options?: {
        commented?: boolean;
    }): string;
    protected createInterfaceMembers(entity: ApiEntitySchema, parentTypeName?: string): ts.PropertySignature[];
    protected createInterfaceFieldType(field: ApiEntityFieldSchema): ts.ArrayTypeNode | ts.UnionTypeNode | ts.KeywordTypeNode<ts.KeywordTypeSyntaxKind>;
    static createKeywordType(Type: string): ts.KeywordTypeNode | ts.UnionTypeNode | ts.ArrayTypeNode;
    static isArray(Type: string): boolean;
    static isJsonType(Type: string): boolean;
    static isBooleanType(Type: string): boolean;
    static isDatetimeType(Type: string): boolean;
    static isStringType(Type: string): boolean;
    static isNumberType(Type: string): boolean;
    static resolveEntityName(name: string | {
        singular: string;
        plural: string;
    }): {
        singular: string;
        plural: string;
    };
}
//# sourceMappingURL=app-api-client.d.ts.map