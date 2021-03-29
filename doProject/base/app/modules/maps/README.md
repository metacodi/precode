# Google Maps

Añadir los estilos de `maps.scss` en el proyecto a través de la clave del archivo:

`angular.json`
```json
{
  "build": {
    "styles": [
      {
        "input": "src/app/modules/maps/maps.scss"
      }
    ]
  }
}
```

`maps.scss`
```scss
// NOTA: Google-Maps cambia la fuente de la aplicación.
body, .ionic-body  {
  font-family: sans-serif !important;    /* HACK! google maps downloads roboto font and blinks the view */
}

// NOTA: Elimina el logo de Google-Maps y los términos del mapa.
a[href^="http://maps.google.com/maps"],
a[href^="https://maps.google.com/maps"],
a[href^="https://www.google.com/maps"] {
     display: none !important;
}
.gm-bundled-control .gmnoprint {
  display: block;
}

.gmnoprint:not(.gm-bundled-control) {
  display: none;
}
.gm-style-cc div {
  maps: none !important;
}
.gm-style > * {
  background-color: var(--ion-color-step-100);
}
```