<div id="top"></div>

# @metacodi/precode


[ts-node](#ts-node) | [scripting](#scripting) | [precode](#precode) | [template](#template) | [code](#code) | [docs](#documentació)

Assistent per implementar tasques d'scripting de creació i manteniment de projectes `TypeScript` sobre un servidor `node.js` en un context de **pre/post-desenvolupament** .

<br />

# [ts-node](#top)

Aquest projecte es fonamenta en l'ús de la llibreria `ts-node` (*TypeScript execution and REPL for node.js*) que permet escriure i executar tasques utilitzant **typescript** com a llenguatge d'scripting.

- Repositori: [ts-node](https://github.com/TypeStrong/ts-node)

## Instal·lació

Per saber si ja tenim el package `ts-node` instal·lat:
```bash
npm ts-node -v
```

Si no el tenim instal·lat executem:
```bash
npm install ts-node
```

Si és un projecte en blanc caldrà instal·lar també el typescript:
```bash
npm install typescript
```

## Usage

Creem un nou arxiu i escribim el següent codi per l'script:

`hello-world.ts`:
```typescript
const message = `Hello, world!`;
console.log(message);
```

I ja podem executar l'script des de la consola:
```bash
npx ts-node hello-world.ts
```

Durant l'execució *ts-node* agafa l'script, fa les comprovacions semàntiques necessàries i, a continuació, *transpil·la* l'script de *TypeScript* a *JavaScript*.

Per evitar els errors de transpil·lat es pot utilitzar l'argument `-T` or `--transpileOnly`.


<br />

# [scripting](#top)

Els scripts han de tenir aquestes dues primeres línies a l'inici de l'arxiu.
```typescript
#!/usr/bin/env node
/// <reference types="node" />
```

Per facilitar l'ús dels arguments podem importar la classe `Prompt` del package `commander`:
```typescript
#!/usr/bin/env node
/// <reference types="node" />

import Prompt from 'commander';

Prompt.program
  .requiredOption('-d, --directory <dir>', 'Carpeta del projecte.')
  .option('-v, --verbose', 'Log verbose')
  ;
Prompt.program.parse(process.argv);

const promptOpts = Prompt.program.opts();

if (promptOpts.verbose) { console.log('Arguments: ', promptOpts); }
```


<br />

<br />

# [precode](#top)

Per utilitzar `precode` en un projecte, cal instal·lar el package des de l'arrel del projecte:

```bash
npm i -D @metacodi/precode
```

Haurem d'esmenar l'arxiu `tsconfig.json` del projecte per excloure de la compilació la carpeta on crearem els scripts:

`/tsconfig.json`
```json
{
  "exclude": [
    "precode"
  ]
}
```

Per definir scripts en `.ts`, crearem una carpeta a l'arrel del projecte `/precode`.

Si el projecte de destí té una resolució de mòdul diferent, com per exemple `"module":"esnext"`, podem tenir problemes a l'hora de definir el nostre script, per exemple quan fem importacions. Podem evitar-ho creant un nou arxiu `tsconfig.json` i establint l'argument `--project` durant l'execució dels scripts:

```bash
npx ts-node --project precode/tsconfig.json precode/publish.ts
```
> Compte amb les barres inclinades, en entorn `Windows` cal canviar-les per `\`.

`precode/tsconfig.json`
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
  }
}
```


Habilitem `esModuleInterop` i `allowSyntheticDefaultImports` per poder importar mòduls `commonjs` sense errors encara que estiguem en un projecte amb resolució `esnext`.


<br />

# [template](#top)

Plantilla per fer els scripts:

```typescript
#!/usr/bin/env node
import chalk from 'chalk';
import Prompt from 'commander';

import { TypescriptProject, Terminal, Resource, Git } from '@metacodi/precode';

Terminal.title('PUBLISH');

Prompt.program
  // .requiredOption('-n, --name <name>', 'Nom del component.')
  .option('-v, --verbose', 'Log verbose')
  ;
Prompt.program.parse(process.argv);

const promptOpts = Prompt.program.opts();

if (promptOpts.verbose) { console.log('Arguments: ', promptOpts); }

Prompt.folder = Resource.normalize((Prompt.folder || process.cwd()));

const project: TypescriptProject = new TypescriptProject(Prompt.folder);
project.initialize().then(async () => {

  // Escriure aquí les accions que volem realitzar per aquest projecte.

});
```

<br />

# [code](#top)

La classe `CodeProject` representa un projecte de codi `TypeScript` i implementa mètodes per a les principals tasques de scripting:

- Crear, copiar i eliminar carpetes i arxius del projecte.
- Substituir o adjuntar contingut en els arxius.
- Cercar y substituir dins el contingut fent servir expressions regulars.
- Clonar repositoris remots.
- Executar ordres a la consola.


## Usage

Exemple de script per inicialitzar un projecte ionic:

`src/scripts/ionic/start.ts`
```typescript
const project: CodeProject = new CodeProject(Prompt.directory);
const git: CodeProjectConfig['git'] = project.config.git;

project.initialize().then(async () => {

  await project.install(`npm i @types/node --save-dev`);
  await project.clone({ from: `${git.url}/tools/app-core.git`, to: 'src/core' });
  await project.move('src/app/home', 'src/app/modules/home');
  await project.folder('src/assets/fonts');
  await project.file('src/theme/fonts.scss', { content: resource.Fonts });

});
```

Per executar-lo des del terminal:
```bash
npx ts-node ionic/start.ts -d C:\work\apps\my-test-app
```

<br />

# [Documentació](#top)

Per obtenir la documentació del projecte ens cal executar l'eina [`typedoc`](https://typedoc.org/guides/installation/). Per saber si la tenim instl·lada:
```bash
npm typedoc -v
```

Si no la tenim instal·lada globalment ho podem fer localment només per aquest projecte:
```bash
npm install typedoc --save-dev
```

Generem la documentació dins la carpeta `docs` extraient-la dels arxius de la carpeta `src/code`.
```bash
typedoc --out docs src/code --readme README.md
```

<br />
