# Notifications

## Introducció

Aquest document descriu el protocol de notificacions d'una aplicació de forma abstracta.

<br /> 

## [Definicions](#notifications)

- Una notificació és la informació que l'aplicació comunica als ususaris com a resposta d'una acció determinada.

- Com en qualsevol acte de comunicació, una notificació requeriex d'un emissor, qui provoca l'acció, i d'un o més receptors del missatge.

- Les notificacions tenen un cicle de vida definit pels següents estats:
  - `Sent`: la notificació ha estat enviada per l'emissor.
  - `Received`: la notificació ha estat rebuda pel receptor al seu dispositiu.
  - `Attended`: (Opcional) la notificació ha estat atesa pel receptor (l'ha llegit i, per tant, se n'ha assabentat).
  - ~~`Solved`: (Opcional) quan la notificació requereix d'una acció determinada per part del receptor.~~

  ```mermaid
  graph LR
    Sent --> Received .-> Attended
  ```

<br />

## [Emissió d'una notificació](#notifications)

- L'emissió es produeix sempre des del `backend` i va dirigida als seus emissors del `frontend`.

- L'emissió d'una notificació des del _backend_ implica:
  - El <u>registre a base de dades</u> de la notificació a la taula `notifications`, i dels seus notificats a la taula `notified`.
  - Opcionalment, també l'emissió d'una <u>notificació push</u> a través del servei FMC.
  - Opcionalment, també l'enviament d'un <u>correu electrònic</u> a través dels servidors de correu.

- L'alerta no s'ha de mostrar mai a l'usuari emissor de la notificació, per tant, l'emissor no ha d'estar mai registrat entre els notificats (`notified`).

- Estructura de dades pel registre de les notificacions:

  ```mermaid
  classDiagram
    notificationActions <|-- notified
    notificationActions <|-- notified
    notificationTypes <|-- notifications
    notifications <|-- notified
    users <|-- notified
    users <|-- devices

    devices: idUser

    class notificationActions {
      code text
      isShared tinyint
    }

    class notificationTypes {
      idLocalize int
      interpolateParams json 
      description varchar
      showAlert tinyint
      showYesNo tinyint
      needToSolve tinyint
    }
    class notifications {
      idNotificationType int
      data json 
      created datetime 
      sent datetime 
      solved datetime
    }
    class notified{
      idUser int
      idNotification int
      idAttendedAction int
      idSolvedAction int
      sent datetime 
      attended datetime 
      solved datetime 
      deleted datetime 
      failed tinyint
    }
  ```

<br /> 

## [Recepció d'una notificació](#notifications)

- La recepció d'una notificació només afecta als notificats registrats a la taula `notified` entre els quals mai hi ha l'emissor de la notificació.

- La recepció d'una notificació al _frontend_ es pot produir de dues maneres:
  - De forma <u>passiva</u>, quan la recepció de la notificació arriba per via del <u>plugin de notificacions push</u> al qual està suscrita l'aplicació.
  - De forma <u>activa</u>, quan l'aplicació sol·licita les notificacions pendents d'atendre a través d'una <u>consulta al registre de la base de dades</u>.

- El destinatari de la recepció pot ser:
  - La <u>persona</u>, quan es necessita que l'atengui (se n'assabenti) i, opcionalment, que la resolgui amb una acció determinada.
  - El <u>dispositiu</u>, quan no requereix que l'usuari se n'assabenti. Per exemple, quan es necessita que s'actualitzi la seva configuració d'alguna manera.

- Quan es rep una notificació via plugin o s'executa de la cua de pendents (normalment des de la home) s'ha de <u>mostrar una alerta a l'usuari</u>. Si per contra, és l'usuari qui decideix anar al llistat de notificacions, llavors no té sentit mostrar-li una alerta de la notificació.

- L'usuari pot establir un estat perquè no el molestin les alertes de notificacions pendents. Des d'aquest punt de vista haurem de diferenciar l'atenció de les alertes segons el seu grau d'importància:
  - Alertes <u>obligatòries</u>: l'usuari ha d'atendre-les encara que tingui activat l'estat de no molestar. Per exemple: l'alerta per pagar un servei.
  - Alertes <u>regulars</u>: si l'usuari té l'estat de no molestar activat, les alertes no llençaran cap missatge i no es marcaran com a ateses fins que decideixi atendre-les.

- Les alertes poden mostar-se utilitzant diferents components:
  - <u>Alert</u>: Bloqueja la utilització fins que l'usuari atén o rebutja l'alerta.
  - <u>Toast</u>: Presenta l'alerta però aquesta marxa passats uns segons.

<br /> 

## [Resolució d'una notificació](#notifications)

- La resolució de la notificació pot ser:
  - <u>Individual</u>, quan cadascun dels receptors (usuari o dispositiu) necessita atendre-la i/o solventar-la de forma independent.
  - <u>Grupal</u>, quan només cal que un dels usuaris receptors l'atengui i/o la solventi. En aquest cas, marcarem com a ateses i/o solventades la resta de notificats.
