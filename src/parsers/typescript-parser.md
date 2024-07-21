# TypescriptParser

La classe _TypescriptParser_ permet interpretar el contingut d'un arxiu amb codi font **TypeScript**.

El contingut s'estructura en un arbre de nodes que es conneix com a **arbre sintàctic abstracte** (AST, de l'anglès _Abstract Syntax Tree_).

TypeScript AST Viewer: <https://ts-ast-viewer.com/>

AST Explorer: <https://astexplorer.net/>

<br />

## Ús

```typescript
const parser = new TypescriptParser(`src/app/sample-class.ts`);
```

Després de crear la instància, des del constructor el parser s'encarrega de llegir i interpretar el contingut de l'arxiu indicat.

També es pot instanciar amb un contingut específic (a més a més del nom de l'arxiu on s'escriurà el resultat, encara que no existeixi).

```typescript
const content = `export class NewSampleClass {}`;
const parser = new TypescriptParser(`src/app/new-sample-class.ts`, content);
```

Després de la manipulcació de l'arxiu a través dels mètodes que ofereix el parser, caldrà guardar els canvis:

```typescript
parser.save();
```


### Exemple d'arxiu TypeScript

```typescript
export const sampleVar = ['light', 'dark'];

export class SampleClass {
  public items = [
    { nom: 'Foo', value: 'foo' },
    { nom: 'Bar', value: 'bar' },
  ];
}
```

<br />

## Cercar nodes

Funcions per travessar l'arbre AST cercant nodes.

### **findClassDeclaration()**

Cerca recursivament els nodes de l'arbre AST per trobar la declaració d'una classe (`ts.ClassDeclaration`) que coincideixi amb el nom indicat.
  ```typescript
  const sample = parser.findClassDeclaration('SampleClass');
  const items = sample.members.find(m => m.name.getText() === 'items');
  ```

### **findIdentifier()**

Cerca recursivament els nodes de l'arbre AST per trobar un identificador (`ts.Identifier | ts.LiteralToken`) que coincideixi amb el nom indicat.
  ```typescript
  const sampleVar = parser.findIdentifier('sampleVar') as ts.VariableDeclaration;
  ```

### **find()**

Travessa l'arbre AST cercant fins que trobi un node amb les opcions de filtre indicades.
  ```typescript
  const items = parser.find((node: ts.Node | ts.Statement) => 
    node.kind === ts.SyntaxKind.PropertyDeclaration && (node as ts.PropertyDeclaration).name.text === 'items'
  );
  ```

### **filter()**

Travessa l'arbre AST cercant nodes segons les opcions de filtre indicades.
  ```typescript
  const options = { recursive: true };
  const variables = parser.filter(ts.VariableDeclaration, options);
  const variables = parser.filter((node: ts.Node | ts.Statement) =>
    node.kind === ts.SyntaxKind.VariableDeclaration && (node as ts.VariableDeclaration).name.text.startsWith('test')
  , options);
  ```



<br />

## Modificar nodes

### **setPropertyValue()**

Permet susbtituir el valor de la propietat d'un objecte.
  ```typescript
  const parser = new TypescriptParser(`src/app/config.ts`);
  parser.setPropertyValue('AppConfig.env', 'dev');
  parser.setPropertyValue('AppConfig.app.title', 'Logic Code');
  parser.save();
  ```
  ```typescript
  export const AppConfig = {
    env: 'dev',
    app: {
      title: 'Logic Code'
    }
  }
  ```

### **insertAfter()**

Insereix un text a continuació del node indicat.
  ```typescript
  const parser = new TypescriptParser(fileName);
  const invoices = parser.findIdentifier('invoices') as ts.VariableDeclaration;
  const arr = invoices.initializer as ts.ArrayLiteralExpression;
  const last = arr.elements[arr.elements.length - 1];
  parser.insertAfter(last, `\n  { num: 123, total: 1055.55 },`);
  parser.save();
  ```
  ```typescript
  export const invoices = [
    { num: 121, total: 810.25 },
    { num: 122, total: 1145.10 },
    { num: 123, total: 1055.55 },
  ]
  ```

<br />

<br />

## Primitius admesos

Aquesta classe només admet certs tipus primitius per poder establir programàticament valors en nodes de l'AST:

- Primitius **simples**: string | number | boolean | null | RegExp

- Primitius **complexes**: object | Array<PrimitiveType>

- Primitius **empty**: undefined | never | unknown | void
