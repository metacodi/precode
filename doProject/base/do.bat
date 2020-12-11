REM ====================================
REM  Exemple:
REM ====================================
REM  do build
REM ====================================
REM  do lang
REM ====================================
REM  do gen src/app/acciones accion
REM ====================================
REM  do docs
REM ====================================
REM  do permissions
REM ====================================

echo off
cls

if [%1]==[ios] (
  echo ionic build %2 && npx cap copy ios && npx cap open ios
  ionic build %2 && npx cap copy ios && npx cap open ios
)

if [%1]==[android] (
  echo ionic build %2 && npx cap copy android && npx cap open android
  ionic build %2 && npx cap copy android && npx cap open android
)

if [%1]==[electron] (
  echo ionic build %2 && npx cap copy @capacitor-community/electron && npx cap open @capacitor-community/electron
  ionic build %2 && npx cap copy @capacitor-community/electron && npx cap open @capacitor-community/electron
)

if [%1]==[build] (
  echo ionic build %2 && npx cap copy && npx cap copy @capacitor-community/electron
  ionic build %2 && npx cap copy && npx cap copy @capacitor-community/electron
)

if [%1]==[compile] (
  echo cd electron && npm run electron:build-mac && npm run electron:build-windows && cd ..
  cd electron && npm run electron:build-mac && npm run electron:build-windows && cd ..
)

if [%1]==[upload] (
  curl -T 'electron/dist/ExcelTaxi Setup 3.0.0.exe' ftp://ftp.metacodi.com --user metacodi:SGFhFy1YXj7473FhFy1Y -d /www/taxi/pre/downloads
  curl -T electron/dist/ExcelTaxi-3.0.0.dmg ftp://ftp.metacodi.com --user metacodi:SGFhFy1YXj7473FhFy1Y -d /www/taxi/pre/downloads
)

if [%1]==[all] (
  do build %2
  do compile
  do upload 
)

if [%1]==[gen] (
  echo gen %2 %3
  set cur=%cd%
  cd C:\Users\Jordi\work\metacodi\tools\precode\scripts\ionic-angular\

  if [%3]==[] (npx ts-node generate.ts -f %cur%\%2 && cd %cur%)
  if [%3] NEQ [] (npx ts-node generate.ts -f %cur%\%2 -s %3 && cd %cur%)
)

if [%1]==[lang] (
  echo curl "https://taxi.metacodi.com/pre/api/i18n?lang=1" -o "src/assets/i18n/es.json"
  curl "https://taxi.metacodi.com/pre/api/i18n?lang=1" -o "src/assets/i18n/es.json"
)

if [%1]==[docs] (
  echo typedoc --out docs src/core
  typedoc --out docs src/core
)

if [%1]==[permissions] (
  echo do permissions %2
  set cur=%cd%
  @REM set perm="C:\Users\Jordi\work\metacodi\taxi\apps\pre\logic-taxi\src\app\permissions.ts"
  cd C:\Users\Jordi\work\metacodi\tools\precode\scripts\ionic-angular\

  @REM echo dir %cur%
  @REM echo arg %perm%
  @REM echo all %cur%\%2

  @REM npx ts-node permissions.ts -f %cur%\%2 && cd %cur%
  npx ts-node permissions.ts -f C:\Users\Jordi\work\metacodi\taxi\apps\pre\logic-taxi\src\app\permissions.ts -c metacodi:SGFhFy1YXj7473FhFy1Y -s ftp.metacodi.com -d /www/taxi/pre/api && cd C:\Users\Jordi\work\metacodi\taxi\apps\pre\logic-taxi\

)