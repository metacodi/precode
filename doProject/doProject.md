# Setup Ionic + capacitor + electron

- Aquest script instal#la un projecte en una nova carpeta, i el deixa configuart i apunt per ser compilat.

- S'estrucutra en passos de forma seqüencial i s'utilitza el primer argument per controla-la.

- Els recurso de configuració s'obtenen de la carpeta `base` que l'acompanyan. i s'han d'adaptar abans de l'execució.

<br/>

## Execució

```bash
sh doProject all logic-taxi ExcelTaxi com.exceltaxisantcugat.user
```

Arguments:

- `all`: ho instal·la tot. Si es volen fer proves, es por substituir per el pas corresponent.
- `folder`: Indica la carpeta on vols posar el projecte, Exemple `logic-taxi`.
- `AppName`: Indica el nom del projecte, exemple `ExcelTaxi`.
- `AppId`: Indica el identificador del package, exemple `com.exceltaxisantcugat.user`.

<br/>

# Configuració previa de la '`/base`'.

- Icones `psd` de la capeta `resources`.
- `FCM` push. https://github.com/metacodi/test/tree/master/capacitor/pushnotifi
  - `google-services.json`
  - `GoogleService-Info.plist`
- [`TEAM IOS`](#team-a-ios)
- Inclure el fitxer `/GoogleService-Info.plist` en el projecte

<br/>


# Configuració detallada.

### TEAM a IOS

`ios/App/App.xcodeproj/project.pbxproj`

```bash
# despres de CODE_SIGN_STYLE = Automatic;
DEVELOPMENT_TEAM = 9JNTELNXEE;  
```
en dos llocs




## ANDROID

on your `MainActivity.java` file add 
```bash
import com.getcapacitor.community.fcm.FCMPlugin; 
```
and then inside the init callback 
```bash
add(FCMPlugin.class);
```

## Cómo crear íconos de apps con Image Asset Studio
https://developer.android.com/studio/write/image-asset-studio?hl=es-419#access

1. En la ventana Project, selecciona la vista de Android.
2. Haz clic con el botón derecho en la carpeta res y selecciona New > Image Asset.

