#!/usr/bin/env node
import { Server as HttpServer, request as httpRequest } from 'http';
import ts from 'typescript';
import chalk from 'chalk';

import { ApiClient, ApiClientOptions, ApiRequestOptions, HttpMethod } from '@metacodi/node-api-client';
import { Resource, ResourceType, Terminal, toPascalCase } from '@metacodi/node-utils';

import { ApiEntityFieldSchema, ApiEntitySchema } from './api-entity-schema';
import { TypescriptParser } from '../parsers/typescript-parser';


export interface AppApiOptions extends ApiClientOptions {
  httpServer: HttpServer;
  apiBaseUrl: string;
  apiIdUser: number;
}

export class AppApiClient extends ApiClient {
  
  constructor(
    public override options: AppApiOptions,
  ) {
    super();
  }

  // ---------------------------------------------------------------------------------------------------
  //  ApiClient implementation
  // ---------------------------------------------------------------------------------------------------

  override baseUrl(): string { return this.options.apiBaseUrl; }

  protected override async getAuthHeaders(method: HttpMethod, endpoint: string, params: any) {
    return {
      'Authorization': 'SERVER',
      'Authorization-User': this.options.apiIdUser,
    }; 
  }

  override async request(method: HttpMethod, endpoint: string, options?: ApiRequestOptions): Promise<any> {
    if (!options) { options = {}; }
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json';
    return super.request(method, endpoint, options);
  }


  // ---------------------------------------------------------------------------------------------------
  //  types
  // ---------------------------------------------------------------------------------------------------

  async processSchemasFromFolder(folder: string, options?: { verbose?: boolean; commented?: boolean; }) {
    if (!options) { options = {}; }
    const verbose = !!options.verbose;
    const commented = !!options.commented;
    const schemaErrors: { file: ResourceType; interfaceName: string; message: any; }[] = [];

    Terminal.title(chalk.bold(`Create entities types`));
    Terminal.logInline('- Scanning folder...');

    // Obtenim els esquemes de la carpeta indicada.
    const resources = Resource.discover(folder, { recursive: true }) as ResourceType[];

    // Reduim l'arbre de resultats a un array.
    const reduce = (res: ResourceType[]): ResourceType[] => res.reduce((files, f) =>
      [...files, ...(/\.schema\.ts$/.test(f.fullName) ? [f] : []), ...reduce(f.children || [])]
    , [] as ResourceType[]);
    const files = reduce(resources);

    Terminal.success(`Found ${chalk.bold(files.length)} schema file(s).`);

    for (const file of files) {

      const { errors } = await this.processSchemaFile(file, { folderRelativeTo: folder, verbose, commented })

      schemaErrors.push(...errors);
    }

    if (schemaErrors.length) {
      Terminal.line();
      Terminal.log(chalk.bold.red(`\nERRORS RESUME:\n`));
      schemaErrors.map(error => {
        const { file, interfaceName, message } = error;
        Terminal.log(`${chalk.red(`x`)} ${file.fullName.substring(folder.length)}`);
        Terminal.log(`  ${chalk.bold.red(interfaceName)}: ${chalk.red(message)}\n`);
      });
    }

  }

  async processSchemaFile(file: ResourceType, options?: { folderRelativeTo?: string; verbose?: boolean; commented?: boolean; }) {
    if (!options) { options = {}; }
    const folderRelativeTo = options.folderRelativeTo === undefined ? false : options.folderRelativeTo;
    const verbose = options.verbose === undefined ? false : options.verbose;
    const commented = options.commented === undefined ? true : options.commented;

    const logFileName = folderRelativeTo ? Terminal.file(file.fullName.substring(folderRelativeTo.length)) : file.fullName;
    const interfaces: { name: string; content: string }[] = [];
    const errors: { file: ResourceType; interfaceName: string; message: any; }[] = [];
    
    Terminal.logInline(`- Parsing ${logFileName}`);
    // Obtenim el codi de les declaracions de tipus EntitySchema de l'arxiu.
    const parser = new TypescriptParser(file.fullName);
    const schemas = parser.filter((node: ts.Node | ts.Statement) => 
      node.kind === ts.SyntaxKind.VariableDeclaration && (node as ts.VariableDeclaration).type?.kind === ts.SyntaxKind.TypeReference
      && ((node as ts.VariableDeclaration).type as any).typeName.escapedText === 'EntitySchema'
    , { recursive: true, firstOnly: false }) as ts.VariableDeclaration[];
    
    if (schemas.length) { Terminal.success(`${logFileName}`); }
    for (const schema of schemas) {
      const schemaName = (schema.name as ts.Identifier).text;

      // Comprovem l'indicador de generació de tipus.
      const generateTypesFileIdentifier = parser.findIdentifier('generateTypesFile', schema) as ts.PropertyAssignment;
      const generateTypesFile = generateTypesFileIdentifier ? parser.getPropertyValue(generateTypesFileIdentifier) : true;
      if (generateTypesFile) {

        // Obtenim el nom de l'entitat.
        const name = parser.getPropertyValue(parser.findIdentifier('name', schema) as ts.PropertyAssignment);
        const entityName = AppApiClient.resolveEntityName(name as any);
        const backendIdentifier = parser.findIdentifier('backend', schema) as ts.PropertyAssignment
        const backend = backendIdentifier ? parser.getPropertyValue(backendIdentifier) : undefined;
        const backendName = AppApiClient.resolveEntityName((backend || name) as any);
        if (verbose) Terminal.log(`  + ${schemaName}`);

        // Obtenim les definicions de detall i de llista de l'entitat.
        const detail = parser.findIdentifier('detail', schema) as ts.PropertyAssignment;
        const list = parser.findIdentifier('list', schema) as ts.PropertyAssignment;
        
        if (detail) {
          const interfaceName = toPascalCase(entityName.singular);
          try {
            if (!interfaces.some(i => i.name === interfaceName)) {
              const entityInterface = await this.processEntity(entityName.singular, backendName.singular, schemaName, detail, parser, file, { verbose, commented });
              if (!verbose) Terminal.log(`  + ${interfaceName}`);
              interfaces.push(entityInterface);
            }
          } catch (error: any) {
            errors.push({ file, interfaceName, message: error?.message || error });
            Terminal.fail(`${chalk.bold.red(interfaceName)}: ${chalk.red(error?.message || error)}`, { indent: verbose ? '    ' : '  ', check: 'x' });
          }
        }

        if (list) {
          const interfaceName = toPascalCase(entityName.plural);
          try {
            if (!interfaces.some(i => i.name === interfaceName)) {
              const entityInterface = await this.processEntity(entityName.plural, backendName.plural, schemaName, list, parser, file, { verbose, commented });
              if (!verbose) Terminal.log(`  + ${interfaceName}`);
              interfaces.push(entityInterface);
            }
          } catch (error: any) {
            errors.push({ file, interfaceName, message: error?.message || error });
            Terminal.fail(`${chalk.bold.red(interfaceName)}: ${chalk.red(error?.message || error)}`, { indent: verbose ? '    ' : '  ', check: 'x' });
          }
        }
      } else {
        Terminal.log(`  - ${schemaName} (skip types generation)`);
      }
    }

    if (interfaces.length) {
      // Guardem totes les interfaces en un sol arxiu de tipus amb el mateix nom que l'esquema.
      const typesFileName = file.name.replace(/\.schema\.ts$/, '.types.ts');
      Resource.save(Resource.concat(file.path, typesFileName), interfaces.map(i => i.content).join(`\n\n`));

      // Indexem els esquemes.
      if (Resource.exists(Resource.concat(file.path, 'index.ts'))) {
        const parserIndex = new TypescriptParser(Resource.concat(file.path, 'index.ts'));
        const moduleSpecifier = typesFileName.replace(/\.ts$/, '');
        const exports = parserIndex.filter(node => node.kind === ts.SyntaxKind.ExportDeclaration, { firstOnly: false }) as ts.ExportDeclaration[];
        const exportTypes = exports.find(e => (e.moduleSpecifier as ts.StringLiteral).text === `./${moduleSpecifier}`);
        if (exportTypes?.exportClause) {
          parserIndex.replacements.push({ start: exportTypes.exportClause.pos + 1, end: exportTypes.exportClause.end, text: `{ ${interfaces.map(i => i.name).join(', ')} }` });
        } else {
          parserIndex.insertAfter(exports.length ? exports[exports.length - 1] : undefined, `export { ${interfaces.map(i => i.name).join(', ')} } from './${moduleSpecifier}';`);
        }
        parserIndex.save();
      }
    }

    return { interfaces, errors };
  }

  protected async processEntity(entityName: string, backendName: string, schemaName: string, entity: ts.PropertyAssignment, parser: TypescriptParser, file: ResourceType, options?: { verbose?: boolean; commented?: boolean; }) {
    if (!options) { options = {}; }
    const verbose = options.verbose === undefined ? false : options.verbose;
    const commented = options.commented === undefined ? true : options.commented;
    Terminal.logInline(`${verbose ? '    ' : '  '}- Processing ${chalk.bold(schemaName)}...`);
    const { fields, relations, params } = this.buildSchemaQuery(entity, parser, file);
    const query = `schema/${backendName}?fields=${fields}&rel=${relations}${params}`;
    if (verbose) Terminal.log(`    + Query: ${chalk.gray(query)}`);
    if (verbose) Terminal.logInline(`    - Requesting schema ${chalk.bold(schemaName)} to database...`);
    const result: ApiEntitySchema = await this.get(query);
    if (Array.isArray(result)) { throw new Error('No se podido obtener el esquema de la base de datos.'); }
    const schema = this.generateSchema(entity, parser, result);
    const interfaceName = `${toPascalCase(entityName)}`;
    // const jsonFile = `${toKebabCase(entityName)}.schema.json`;
    // Resource.save(Resource.concat(file.path, jsonFile), JSON.stringify(schema, null, '  '));
    if (verbose) Terminal.log(`    + Creating interface ${chalk.bold(interfaceName)}`);
    return {
      name: interfaceName,
      content: this.stringifySchema(schema, interfaceName, { commented }),
    };
  }

  protected buildSchemaQuery(entity: ts.PropertyAssignment, parser: TypescriptParser, file: ResourceType) {
    const relationsProperty = parser.find((node: ts.Node | ts.Statement) => 
      node.kind === ts.SyntaxKind.PropertyAssignment && ((node as ts.PropertyAssignment).name as any).text === 'relations'
    , { parent: entity.initializer, recursive: false, firstOnly: true }) as ts.PropertyAssignment;
    let schemaRelations;
    if (relationsProperty) {
      // Comprovem el tipus de declració.
      if (relationsProperty.initializer.kind === ts.SyntaxKind.Identifier) {
        // Recollim el nom de la variable on es descriuen les relacions.
        const relationsVariableName = (relationsProperty.initializer as ts.Identifier).text;
        // Cerquem la varaible dins del mateix arxiu.
        const relationsLocalDeclaration = parser.find((node: ts.Node | ts.Statement) => 
          node.kind === ts.SyntaxKind.VariableDeclaration && ((node as ts.VariableDeclaration).name as any).text === relationsVariableName
        , { recursive: true, firstOnly: true }) as ts.VariableDeclaration;
        if (relationsLocalDeclaration?.initializer) {
          schemaRelations = parser.parsePropertyInitializer(relationsLocalDeclaration.initializer);
        } else {
          // Cerquem la variable entre els imports.
          const imports = parser.getImportDeclarations();
          const importFound = imports.find(i => parser.getImportClauseNames(i).includes(relationsVariableName));
          if (importFound) {
            const moduleSpecifier = `${(importFound.moduleSpecifier as ts.StringLiteral).text}.ts`;
            const countBacks = moduleSpecifier.split('/').filter(s => s === '..').length;
            const importFileName = moduleSpecifier.startsWith('../') ? Resource.concat(Resource.split(file.path).slice(0, -countBacks).join('/'), moduleSpecifier.substring('../'.length * countBacks)) :
              moduleSpecifier.startsWith('./') ? Resource.concat(file.path, moduleSpecifier.substring(2)) :
              Resource.concat(file.path, moduleSpecifier)
            ;
            const importParser = new TypescriptParser(importFileName);
            const relationsImportedDeclaration = importParser.find((node: ts.Node | ts.Statement) => 
              node.kind === ts.SyntaxKind.VariableDeclaration && ((node as ts.VariableDeclaration).name as any).text === relationsVariableName
            , { recursive: true, firstOnly: true }) as ts.VariableDeclaration;
            schemaRelations = parser.parsePropertyInitializer(relationsImportedDeclaration.initializer as ts.Expression);
          }
        }              
      } else {
        // Declaració literal.
        schemaRelations = parser.getPropertyValue(relationsProperty);
      }
    }
    const relations = Array.isArray(schemaRelations) ? schemaRelations.join(',') : schemaRelations || '';
    const fieldsProperty = parser.find((node: ts.Node | ts.Statement) => 
      node.kind === ts.SyntaxKind.PropertyAssignment && ((node as ts.PropertyAssignment).name as any).text === 'fields'
    , { parent: entity.initializer, recursive: false, firstOnly: true }) as ts.PropertyAssignment;
    const fieldsValue = fieldsProperty ? parser.getPropertyValue(fieldsProperty) : undefined;
    const fields = Array.isArray(fieldsValue) ? fieldsValue.join(',') : fieldsValue || '';
    const paramsProperty = parser.find((node: ts.Node | ts.Statement) => 
      node.kind === ts.SyntaxKind.PropertyAssignment && ((node as ts.PropertyAssignment).name as any).text === 'params' && (node as ts.PropertyAssignment).initializer.kind !== ts.SyntaxKind.ArrowFunction
    , { parent: entity.initializer, recursive: false, firstOnly: true }) as ts.PropertyAssignment;
    const paramsValue = paramsProperty ? parser.getPropertyValue(paramsProperty) : undefined;
    const params = Array.isArray(paramsValue) ? `&${paramsValue.join('&')}` : '';
  
    return { fields, relations, params }
  };
  
  protected generateSchema(entity: ts.PropertyAssignment, parser: TypescriptParser, schema: ApiEntitySchema): ApiEntitySchema {
    // Obtenim la funció declarada a l'esquema.
    const fnProperty = parser.find((node: ts.Node | ts.Statement) => 
      node.kind === ts.SyntaxKind.PropertyAssignment && ((node as ts.PropertyAssignment).name as any).text === 'mapSchema'
    , { parent: entity.initializer, recursive: false, firstOnly: true }) as ts.PropertyAssignment;
    if (!fnProperty) { return schema; }
    // const fnDefinition = (fnProperty.initializer as ts.ArrowFunction as any).text;
    const source = ts.createSourceFile('', /*sourceText*/ '', ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const fnDefinition = printer.printNode(ts.EmitHint.Unspecified, fnProperty.initializer, source);
    if (!fnDefinition) { return schema; }
    // Evaluem la funció.
    const fnCode = ts.transpile(fnDefinition).replace(/\n/g, '').replace(/;$/, '');
    // const wrapper = `({ fn: function (schema) { return (${fnCode}); } });`;
    const wrapper = `({ fn: ${fnCode} });`;
    let runnable: { fn: (schema: ApiEntitySchema) => ApiEntitySchema } = eval(wrapper);
    try { runnable = eval(wrapper); } catch (e) { throw new Error (`Evaluando el código '${fnDefinition}'\n${e}\n\n> wrapper:\n${wrapper}`); }
    schema = runnable.fn(schema);
    return schema;
  }  

  protected stringifySchema(entity: ApiEntitySchema, name: string, options?: { commented?: boolean }) {
    if (!options) { options = {}; }
    const commented = options.commented === undefined ? false : options.commented;
    const interfaceDeclaration = ts.factory.createInterfaceDeclaration(
      /*modifiers*/ [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
      /*name*/ name,
      /*typeParameters*/ undefined,
      /*heritageClauses*/ undefined,
      /*members*/ this.createInterfaceMembers(entity, name),
    );
    const source = ts.createSourceFile('', /*sourceText*/ '', ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed  });
    const result = printer.printNode(ts.EmitHint.Unspecified, interfaceDeclaration, source).replace(/    /g, '  ').replace(/"/g, '\'');
    if (commented) {
      const comment = `/**\n * \`\`\`typescript\n * ${result.replace(/\n/g, '\n * ')}\n * \`\`\`\n *\/\n`;
      return `${comment}${result}`;
    } else {
      return result;
    }
  };

  protected createInterfaceMembers(entity: ApiEntitySchema, parentTypeName?: string) {
    const sort = false;
    if (sort) {
      entity.fields = entity.fields.sort((a, b) => (a.Field > b.Field) ? 1 : -1);
      entity.parentTables = (entity.parentTables || []).sort((a, b) => (a.tableAlias > b.tableAlias) ? 1 : -1);
      entity.childTables = (entity.childTables || []).sort((a, b) => (a.tableAlias > b.tableAlias) ? 1 : -1);
    }
    const members = entity.fields.map(f => {
      return ts.factory.createPropertySignature(
        /*modifiers*/ undefined,
        /*name*/ f.Field,
        /*questionToken*/ f.optional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
        /*type*/ this.createInterfaceFieldType(f),
      );
    });
    (entity.parentTables || []).map(parent => {
      const name = parent.tableAlias.split('.').pop() || parent.name.singular;
      const foreignChild = entity.fields.find(f => f.Field === parent.relation?.child.field);
      const isNullable = !foreignChild || foreignChild.Null === 'YES';
      if (parent.relation?.is_circular_reference) {
        const circularTypeName = parentTypeName || toPascalCase(parent.tableAlias.split('.').pop() || parent.name.singular);
        members.push(ts.factory.createPropertySignature(
          /*modifiers*/ undefined,
          /*name*/ name,
          /*questionToken*/ isNullable ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
          /*type*/ ts.factory.createTypeReferenceNode(ts.factory.createIdentifier(circularTypeName)),
        ));
      } else {
        members.push(ts.factory.createPropertySignature(
          /*modifiers*/ undefined,
          /*name*/ name,
          /*questionToken*/ isNullable ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
          /*type*/ ts.factory.createTypeLiteralNode(this.createInterfaceMembers(parent)),
        ));
      }
    });
    (entity.childTables || []).map(child => {
      const name = child.tableAlias.split('.').pop() || child.name.plural;
      members.push(ts.factory.createPropertySignature(
        /*modifiers*/ undefined,
        /*name*/ name,
        /*questionToken*/ undefined,
        /*type*/ ts.factory.createArrayTypeNode(ts.factory.createTypeLiteralNode(this.createInterfaceMembers(child))),
      ));
    });
    return members;
  };

  protected createInterfaceFieldType(field: ApiEntityFieldSchema) {
    return field.Null === 'YES' ? ts.factory.createUnionTypeNode([
      AppApiClient.createKeywordType(field.Type),
      ts.factory.createLiteralTypeNode(ts.factory.createNull()),
    ]) : AppApiClient.createKeywordType(field.Type);
    // return field.Key === 'PRI' ? ts.factory.createUnionTypeNode([
    //   AppApiClient.createKeywordType(field.Type),
    //   ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral('new')),
    // ]) : field.Null === 'YES' ? ts.factory.createUnionTypeNode([
    //   AppApiClient.createKeywordType(field.Type),
    //   ts.factory.createLiteralTypeNode(ts.factory.createNull()),
    // ]) : AppApiClient.createKeywordType(field.Type);
  }


  // ---------------------------------------------------------------------------------------------------
  //  helpers
  // ---------------------------------------------------------------------------------------------------

  static createKeywordType(Type: string): ts.KeywordTypeNode | ts.UnionTypeNode | ts.ArrayTypeNode {
    // NOTA: Fem un tractament especial pels camps incrustats que són arrays d'un tipus i no d'un objecte que representa una fila. Ex: camp `areasFlotas` construït durant el login pels supers d'àrea.
    if (AppApiClient.isArray(Type)) return ts.factory.createArrayTypeNode(AppApiClient.createKeywordType(Type.slice(1, -1)));
    if (AppApiClient.isBooleanType(Type)) return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
    if (AppApiClient.isStringType(Type)) return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    if (AppApiClient.isDatetimeType(Type)) return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    if (AppApiClient.isNumberType(Type)) return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    if (AppApiClient.isJsonType(Type)) return ts.factory.createUnionTypeNode([
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      ts.factory.createTypeLiteralNode([ts.factory.createIndexSignature(
        /*modifiers*/ undefined,
        /*parameters*/ [ts.factory.createParameterDeclaration(
          /*modifiers*/ undefined,
          /*dotDotDotToken*/ undefined,
          /*name*/ 'key',
          /*questionToken*/ undefined,
          /*type*/ ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          /*initializer*/ undefined,
        )],
        /*type*/ ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
      )])
    ]);
    if (Type === '') return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    throw new Error(`Unrecognized database type '${Type}'.`);
  };

  static isArray(Type: string): boolean { return /^\[[^]*\]$/.test(Type); }

  static isJsonType(Type: string): boolean { return Type.startsWith('longtext'); }

  static isBooleanType(Type: string): boolean { return Type.startsWith('tinyint(1)') || Type.startsWith('bool') || Type.startsWith('boolean'); }

  static isDatetimeType(Type: string): boolean { return Type.startsWith('datetime') || Type.startsWith('date') || Type.startsWith('time'); }

  static isStringType(Type: string): boolean { return Type.startsWith('varchar') || Type.startsWith('char') || Type.startsWith('text'); }

  static isNumberType(Type: string): boolean {
    return Type.startsWith('int') || Type.startsWith('integer') || Type.startsWith('smallint') || Type.startsWith('mediumint') || Type.startsWith('bigint') ||
    Type.startsWith('float') || Type.startsWith('double') || Type.startsWith('decimal') || Type.startsWith('dec') || Type.startsWith('numeric') ||
    (Type.startsWith('tinyint') && !Type.startsWith('tinyint(1)'));
  }

  static resolveEntityName(name: string | { singular: string; plural: string }): { singular: string; plural: string } {
    if (typeof name === 'object') { return name; }
    return { singular: name.endsWith('s') ? name.substring(0, name.length - 1) : name, plural: name };
  }
}
