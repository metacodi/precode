# app-core

**Ionic 4** core for mobile apps providing **abstract data** layer, access to **api-rest**, **analytics** layer, application **themes** managment...

[abstract](#abstract) | [api-rest](#api-rest) | [analytics](#analytics)


<br />

## Installation

Desde el terminal escribir en la carpeta raíz del proyeco:
```
git clone http://gitlab.codi.ovh/tools/app-core src/app/core
```

### Update

Tras la primera instalación y para cada actualización ejecutar el _script_ [`update-app-core.bat`](http://gitlab.codi.ovh/tools/app-core/blob/master/update-app-core.bat) desde la raíz del proyecto:


## Overview

El repositorio `app-core` es una biblioteca de clases para asistir durante el desarrollo de aplicaciones móviles basadas en [Ionic](https://ionicframework.com/docs) y [Angular](https://angular.io/docs).

Se divide en diferentes módulos:

- [Capa abstracta metadática](#abstract)
- [Servicio de acceso a datos Api-Restful](#api-rest)
- [Servicio de analítica](#analytics)
- Servicio de gestión de temáticas
- Directivas, _pipes_, funciones auxiliares...

<br />

# Abstract

La capa abstracta ofrece una base sobre la que construir aplicaciones con acceso a datos.

Está constituida por una seria de plantillas de código que se combinan con esquemas de metadatos para facilitar la implementación de componentes y servicios.

- Componente para listados
- Componente para fichas de detalle
- Componente para búsquedas
- Servicio para el modelo de datos
- Esquemas del modelo de datos
- Row hooks

<br />

# Api Rest

El servicio [`ApiService`](http://gitlab.codi.ovh/tools/app-core/blob/master/api/api.service.ts) permite encaminar las llamadas hacia un _backend_ provisto de una **Api Restful**.

- Administración de una cola para gestionar suscriptores hacia las mismas consultas (evita duplicados).
- Gestión automática del spinner para el efecto de carga.

<br />

# Analytics

La capa analítica encapsula los servicios de `FireBase` de _Google_ para monitorizar el uso de las aplicaciones.

Se puede implementar:

- A través de **directivas** como [`AnalyticsScreenDirective`](http://gitlab.codi.ovh/tools/app-core/blob/master/analytics/analytics.directive.ts) y [`AnalyticsEventDirective`](http://gitlab.codi.ovh/tools/app-core/blob/master/analytics/analytics.directive.ts) para establecer la telemetría desde los templates `html`.
- A través del **servicio** [`AnalyticsService`](http://gitlab.codi.ovh/tools/app-core/blob/master/analytics/analytics.service.ts) desde el nivel programático.


<br />

# ISSUES

Al importar la librería `import * as ts from 'typescript';` aparece un WARNING al compilar:
```bash
WARNING in ./node_modules/source-map-support/source-map-support.js
```

Actualizar el archivo para cambiar la configuración del `node`:
`\node_modules\@angular-devkit\build-angular\src\angular-cli-files\models\webpack-configs\browser.js`
```typescript
node: false,
```

Y cambiar por:
```typescript
node: {fs: 'empty', module: 'empty'},
```
