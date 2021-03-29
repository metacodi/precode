# Launch Navigator

El mòdul de launch navigator llança les apps de navegació de mapes ('Google Maps', 'Waze') instal·lades al dispositiu.

- Repo: <https://ionicframework.com/docs/native/launch-navigator>

<br />

## Instal·lació

El mòdul utilitza el plugin de Cordova `Launch Navigator`, és necessari fer un wraper pq no funciona correctament amb capacitor.

Per poder utilitzar aquest servei es necessari intal·la el plugin.

```sh
npm install uk.co.workingedge.phonegap.plugin.launchnavigator
npm install @ionic-native/launch-navigator
ionic cap sync
```

<br />

`app.module.ts`:

```typescript
import { LaunchNavigator } from '@ionic-native/launch-navigator/ngx';


@NgModule({
  providers: [
    LaunchNavigator,
  ],
})
export class AppModule {}
```
<br />

## Ús

`my-component.ts`
```typescript
import { LaunchNavigatorService } from 'src/modules/launch-navigator';
```