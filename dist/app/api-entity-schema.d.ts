export interface ApiEntitySchema {
    access?: 'private' | 'public';
    file?: string;
    tableName?: string;
    entityName?: string;
    type?: 'BASE TABLE' | 'VIEW' | 'SYSTEM VIEW';
    name?: {
        singular: string;
        plural: string;
    };
    tableAlias: string;
    originalAlias?: string;
    primaryKey?: string;
    fields: ApiEntityFieldSchema[];
    isParentTable?: boolean;
    isChildTable?: boolean;
    relation?: null | ApiEntityRelationSchema;
    parentTables?: ApiEntitySchema[];
    childTables?: ApiEntitySchema[];
    groupBy?: string[];
}
export interface ApiEntityFieldSchema {
    Field: string;
    Type: string;
    Null?: 'YES' | 'NO';
    Key?: 'PRI' | 'UNI' | 'MUL' | '';
    Default?: any;
    Extra?: string;
    virtual?: boolean;
    alias?: string;
    optional?: boolean;
}
export interface ApiEntityRelationSchema {
    parent?: {
        table: string;
        field: string;
    };
    child: {
        table?: string;
        field: string;
    };
    is_circular_reference?: boolean;
}
//# sourceMappingURL=api-entity-schema.d.ts.map