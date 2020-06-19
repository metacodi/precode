import { environment } from 'src/environments/environment';

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
    url: environment.production ? 'https://dev.exceltaxisantcugat.cat/api/' : (environment.pre_production ? 'https://pre.exceltaxisantcugat.cat/api/' : 'https://dev.exceltaxisantcugat.cat/api/'),
  },

  language: {
    getLocalize: true, // Indica si se usarán las tablas lang.
    default: { idreg: 1, isoName: 'Spanish', nativeName: 'Español', isoCode: 'es', langCode: 'es-es' },
    available: [
      { idreg: 1, isoName: 'Spanish', nativeName: 'Español', isoCode: 'es', langCode: 'es-es' },
      // { idreg: 1, isoName: 'Catalan', nativeName: 'Català', isoCode: 'ca', langCode: 'ca-es' },
      // { idreg: 1, isoName: 'English', nativeName: 'English', isoCode: 'en', langCode: 'en-en' },
    ],
  },

  google: {
    maps: {
      url: 'https://maps.googleapis.com/maps/api/js',
      lang: 'ca',
      key: 'AIzaSyCGOucQgyCKEjODBYuD0vukES4WVAfBoOI',
      defaultLocation: {
        // Sant Cugat
        lat: 41.4744074,
        lng: 2.0864961,
      }
    }
  },

  themes: [
    'theme-dark',
    'theme-light'
  ],

};
