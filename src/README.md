# Abstract Syntax Tree (AST)

- [AST Explorer](https://astexplorer.net/)
- [Arquitectural overwiew](https://github.com/microsoft/TypeScript/wiki/Architectural-Overview)
- [Using the Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [PHP Parser for Nodejs](https://github.com/glayzzle/php-parser)


<br /> 

Crear un programa a partir de los archivos del proyecto:
```typescript
import * as ts from 'typescript';

// hardcode our input file
const fileName = './src/models.ts';

// create a program instance, which is a collection of source files
// in this case we only have one source file
const program = ts.createProgram([fileName], {});

// pull off the typechecker instance from our program
const checker = program.getTypeChecker();

// get our models.ts source file AST
const source = program.getSourceFile(fileName);

// visit each node in the root AST and log its kind
ts.forEachChild(source, node => { console.log(ts.SyntaxKind[node.kind]); });
```


When calling `tsc` inside the project directory, `performCompilation` is called with `configParseResult.fileNames`.

configParseResult is built with `parseConfigFileWithSystem` > `getParsedCommandLineOfConfigFile` > `parseJsonConfigFileContentWorker` > `getFileNames`.

<br />

Obtener una estructura de árbol sintáctico a partir de un archivo de código:
```typescript
import * as fs from 'fs';
import * as ts from 'typescript';

function getSourceFile(fileName: string, content?: string) {
  const sourceCode: string = content || fs.readFileSync(fileName, 'utf-8');
  const sourceFile: ts.SourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.Latest, /* setParentNodes */ true);
  return sourceFile;
}

const sourceFile = getSourceFile(Prompt.file);
```

Function for traverse the Abstract Syntax Tree:
```typescript
function traverse(node: ts.Node) {
  if (ts.isFunctionDeclaration(node)) {
    for (const param of node.parameters) {
      console.log(param.name.getText());
    }
  }
  node.forEachChild(traverse);
}
```

Crear una sentencia programáticamente y renderizar el resultado en texto.
```typescript
const statement = ts.createVariableStatement(
  [],
  ts.createVariableDeclarationList(
      [ts.createVariableDeclaration(
          ts.createIdentifier('testVar'),
          ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          ts.createStringLiteral('test')
      )],
      ts.NodeFlags.Const
  )
);

const printer = ts.createPrinter();

const result = printer.printNode(
  ts.EmitHint.Unspecified,
  statement,
  undefined
);
```

<br />

## TextReplacer

Define y aplica operaciones de inserción, susticución y eliminación de texto del contenido indicado.

Se puede crear una instancia y opcionalmente definir el contenido al mismo tiempo.
```typescript
const source = fs.readFileSync(fileName, 'utf-8');
const replacer = new TextReplacer(source);
```

Insertamos una sentencia de importación al final del bloque de importaciones (después del lastImport).
```typescript
const newImport = `\nimport { NgModule } from '@angular/core';`;
replacer.insert(lastImport.end, newImport);
```

Aplica las substituciones de texto al contenido (si no se indica ningún contenido, se utiliza el contenido 
que fue establecido a través del constructor cuando se instanció la clase).
```typescript
const source = fs.readFileSync(fileName, 'utf-8');
const result = replacer.apply(source);
```


<br /> 

# PHP AST

- Repo: <https://github.com/glayzzle/php-parser>

Install PHP Parser:
```bash
npm install php-parser --save
```

Parse PHP file:
```typescript
// initialize the php parser factory class
var fs = require('fs');
var path = require('path');
var engine = require('php-parser');

// initialize a new parser instance
var parser = new engine({
  // some options :
  parser: {
    extractDoc: true,
    php7: true
  },
  ast: {
    withPositions: true
  }
});

// Retrieve the AST from the specified source
var eval = parser.parseEval('echo "Hello World";');

// Retrieve an array of tokens (same as php function token_get_all)
var tokens = parser.tokenGetAll('<?php echo "Hello World";');

// Load a static file (Note: this file should exist on your computer)
var phpFile = fs.readFileSync( './example.php' );

// Log out results
console.log( 'Eval parse:', eval );
console.log( 'Tokens parse:', tokens );
console.log( 'File parse:', parser.parseCode(phpFile) );
```