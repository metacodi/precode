# Precode

[ts-node](#ts-node) | [scripting](#scripting) | [code](#code) | [docs](#documentació)

Assistent per implementar tasques d'scripting de creació i manteniment de projectes `TypeScript` en un context de **pre-desenvolupament** sobre un servidor `node.js`.

## Estructura del projecte

- `src/scripts` conté scripts per executar amb l'eina `ts-node`.
- `src/code` conté classes i tipus dissenyats per manipular arxius de codi `TypeScript`.

<br />

# ts-node

El projecte es fonamenta en l'ús de la llibreria `ts-node` (*TypeScript execution and REPL for node.js*) que permet escriure i executar les tasques desitjades utilitzant **typescript** com a llenguatge de scripting.

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

# scripting

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

Prompt
  .requiredOption('-d, --directory <dir>', 'Carpeta del projecte.')
  .option('-v, --verbose', 'Log verbose')
  ;
Prompt.parse(process.argv);

if (Prompt.verbose) { console.log('Arguments: ', Prompt.opts()); }
```


<br />

<br />

# code

La classe `CodeProject` representa un projecte de codi `TypeScript` i implementa mètodes per a les principals tasques de scripting:

- Crear, copiar i eliminar carpetes i arxius del projecte.
- Substituir o adjuntar contingut en els arxius.
- Cercar y substituir dins el contingut fent servir expressions regulars.
- Clonar repositoris remots.
- Executar ordres a la consola.

A la ubicació del projecte s'espera trobar un arxiu `precode.json` amb la configuració del projecte.
Aquest arxiu ha de tenir l'estructura del tipus `CodeProjectConfig`:
```typescript
export interface CodeProjectConfig {
  app: { name: string; package: string; };
  api?: { url: { dev: string; pre?: string; pro?: string; }, version?: string };
  git?: { url: string; token?: string; };
  dependencies?: ProjectDependency[];
}

export interface ProjectDependency {
  name: string;
  url: string;
  dependencies: ProjectDependency[];
}
```

`precode.json`
```json
{
  "app": {
    "name": "test-ionic-project",
    "package": "com.test-ionic-project.app"
  },
  "git": {
    "url": "http://gitlab.codi.ovh",
    "token": "ZEYAt5UZyeyiZ6PyXBLP"
  }
}
```

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

# Documentació

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
