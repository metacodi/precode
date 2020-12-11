import { environment } from 'src/environments/environment';
import { defaultDarkTheme } from './assets/themes/dark/default/theme';
import { defaultLightTheme } from './assets/themes/light/default/theme';
import { oceanTheme } from './assets/themes/light/ocean/theme';
import { silverTheme } from './assets/themes/dark/silver/theme';

// ---------------------------------------------------------------------------------------------------
//  config
// ---------------------------------------------------------------------------------------------------

export const AppConfig = {

  app: {
    name: 'excel-taxi',
    package: 'com.exceltaxisantcugat.user',
    id: 1,
  },

  debugEnabled: !environment.production,
  stringifyEnabled: false,

  api: {
    url: environment.production
      ? 'https://taxi.metacodi.com/pre/api'
      : (
        environment.pre_production
        ? 'https://taxi.metacodi.com/pre/api'
        : 'https://taxi.metacodi.com/dev/api'
      )
    ,
  },

  language: {
    i18n: true, // Indica si se usarán las tablas lang.
    default: { idreg: 1, isoName: 'Spanish', nativeName: 'Español', isoCode: 'es', langCode: 'es-es' },
    available: [
      { idreg: 1, isoName: 'Spanish', nativeName: 'Español', isoCode: 'es', langCode: 'es-es' },
      { idreg: 2, isoName: 'Catalan', nativeName: 'Català', isoCode: 'ca', langCode: 'ca-es' },
      { idreg: 3, isoName: 'English', nativeName: 'English', isoCode: 'en', langCode: 'en-en' },
    ],
  },

  currency: {
    code: 'EUR',
    display: 'symbol',
    digitsInfo: '1.0-2',
  },

  google: {
    maps: {
      url: 'https://maps.googleapis.com/maps/api/js',
      lang: 'ca',
      key: 'AIzaSyCGOucQgyCKEjODBYuD0vukES4WVAfBoOI',
      // key: 'AIzaSyDyttGTPLBDFyY874lg8_PZRp3FGPxZNEU', // Transfeli
      defaultLocation: {
        // Sant Cugat
        lat: 41.4744074,
        lng: 2.0864961,
      },
    },
  },

  notifications: {
    allowIntervalRequest: false,
  },

  versionControl: {
    allowCheckVersion: false,
  },

  themes: [
    defaultLightTheme,
    defaultDarkTheme,
    oceanTheme,
    silverTheme,
  ],

};
