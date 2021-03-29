import { ThemeScheme } from 'src/core/util';



export const defaultDarkTheme: ThemeScheme = {
  name: 'default',
  mode: 'dark',
  style:
    {
      root: {
        // ** primary **/
        '--ion-color-primary': '#ffce00',
        '--ion-color-primary-rgb': '255,206,0',
        '--ion-color-primary-contrast': '#000000',
        '--ion-color-primary-contrast-rgb': '0,0,0',
        '--ion-color-primary-shade': '#e0b500',
        '--ion-color-primary-tint': '#ffd31a',

        // ** secondary **/
        '--ion-color-secondary': '#454545',
        '--ion-color-secondary-rgb': '69,69,69',
        '--ion-color-secondary-contrast': '#ffffff',
        '--ion-color-secondary-contrast-rgb': '255,255,255',
        '--ion-color-secondary-shade': '#3d3d3d',
        '--ion-color-secondary-tint': '#585858',

        // ** tertiary **/
        '--ion-color-tertiary': '#3880ff',
        '--ion-color-tertiary-rgb': '56,128,255',
        '--ion-color-tertiary-contrast': '#ffffff',
        '--ion-color-tertiary-contrast-rgb': '255, 255, 255',
        '--ion-color-tertiary-shade': '#3171e0',
        '--ion-color-tertiary-tint': '#4c8dff',

        // ** success **/
        '--ion-color-success': '#0d9845',
        '--ion-color-success-rgb': '13,152,69',
        '--ion-color-success-contrast': '#ffffff',
        '--ion-color-success-contrast-rgb': '255,255,255',
        '--ion-color-success-shade': '#0b863d',
        '--ion-color-success-tint': '#25a258',

        // ** warning **/
        '--ion-color-warning': '#ff9100',
        '--ion-color-warning-rgb': '255,145,0',
        '--ion-color-warning-contrast': '#000000',
        '--ion-color-warning-contrast-rgb': '0,0,0',
        '--ion-color-warning-shade': '#e08000',
        '--ion-color-warning-tint': '#ff9c1a',

        // ** danger **/
        '--ion-color-danger': '#f04141',
        '--ion-color-danger-rgb': '245, 61, 61',
        '--ion-color-danger-contrast': '#ffffff',
        '--ion-color-danger-contrast-rgb': '255, 255, 255',
        '--ion-color-danger-shade': '#d33939',
        '--ion-color-danger-tint': '#f25454',

        // ** dark **/
        '--ion-color-dark': '#f4f5f8',
        '--ion-color-dark-rgb': '244,245,248',
        '--ion-color-dark-contrast': '#000000',
        '--ion-color-dark-contrast-rgb': '0,0,0',
        '--ion-color-dark-shade': '#d7d8da',
        '--ion-color-dark-tint': '#f5f6f9',

        // ** medium **/
        '--ion-color-medium': '#989aa2',
        '--ion-color-medium-rgb': '152,154,162',
        '--ion-color-medium-contrast': '#000000',
        '--ion-color-medium-contrast-rgb': '0,0,0',
        '--ion-color-medium-shade': '#86888f',
        '--ion-color-medium-tint': '#a2a4ab',

        // ** light **/
        '--ion-color-light': '#222428',
        '--ion-color-light-rgb': '34,36,40',
        '--ion-color-light-contrast': '#ffffff',
        '--ion-color-light-contrast-rgb': '255,255,255',
        '--ion-color-light-shade': '#1e2023',
        '--ion-color-light-tint': '#383a3e',


        // Colors generated via tool': 'https':/'/ionicframework.com/docs/theming/themes/#stepped-colors
        '--ion-color-step-50': '#0d0d0d',
        '--ion-color-step-100': '#1a1a1a',
        '--ion-color-step-150': '#262626',
        '--ion-color-step-200': '#333333',
        '--ion-color-step-250': '#404040',
        '--ion-color-step-300': '#4d4d4d',
        '--ion-color-step-350': '#595959',
        '--ion-color-step-400': '#666666',
        '--ion-color-step-450': '#737373',
        '--ion-color-step-500': '#808080',
        '--ion-color-step-550': '#8c8c8c',
        '--ion-color-step-600': '#999999',
        '--ion-color-step-650': '#a6a6a6',
        '--ion-color-step-750': '#bfbfbf',
        '--ion-color-step-800': '#cccccc',
        '--ion-color-step-850': '#d9d9d9',
        '--ion-color-step-900': '#e6e6e6',
        '--ion-color-step-950': '#f2f2f2',

        '--background-text-area': '#000000',
        '--color-text-area': '#eeeeee',

        '--placeholder-color': '#aaa',

        //  Colores principales
        // header
        '--header-background-color': '#3e3e3e',

        // text
        '--ion-text-color': '#fdfdfd',
        '--ion-text-color-rgb': '253,253,253',

        // background
        '--ion-background-color': '#000000',
        '--ion-background-color-rgb': '0,0,0',

        // border
        '--ion-border-color': '#555',
        '--ion-border-color-rgb': '216,216,216',

        //  Pick map
        // search results
        '--search-result-background-color': '#3e3e3e',

        //  Reservar
        '--footer-background-animado': '#393939',

        '--ion-toolbar-background': '#0d0d0d',
        '--ion-item-background': '#000000',
        '--ion-tab-bar-background': '#1f1f1f',
        '--ion-card-background': '#1e1e1e',

        '--ion-item-divider-background-color': '#1a1a1a',
      },
      ios: {
        '--ion-background-color': '#000000',
        '--ion-background-color-rgb': '0,0,0',

        '--ion-text-color': '#ffffff',
        '--ion-text-color-rgb': '255,255,255',

        '--ion-color-step-50': '#0d0d0d',
        '--ion-color-step-100': '#1a1a1a',
        '--ion-color-step-150': '#262626',
        '--ion-color-step-200': '#333333',
        '--ion-color-step-250': '#404040',
        '--ion-color-step-300': '#4d4d4d',
        '--ion-color-step-350': '#595959',
        '--ion-color-step-400': '#666666',
        '--ion-color-step-450': '#737373',
        '--ion-color-step-500': '#808080',
        '--ion-color-step-550': '#8c8c8c',
        '--ion-color-step-600': '#999999',
        '--ion-color-step-650': '#a6a6a6',
        '--ion-color-step-700': '#b3b3b3',
        '--ion-color-step-750': '#bfbfbf',
        '--ion-color-step-800': '#cccccc',
        '--ion-color-step-850': '#d9d9d9',
        '--ion-color-step-900': '#e6e6e6',
        '--ion-color-step-950': '#f2f2f2',

        '--ion-toolbar-background': '#0d0d0d',
        '--ion-item-background': '#000000',
        '--ion-card-background': '#1c1c1d',
      },
      md: {
        '--ion-background-color': '#121212',
        '--ion-background-color-rgb': '18,18,18',

        '--ion-text-color': '#ffffff',
        '--ion-text-color-rgb': '255,255,255',

        '--ion-border-color': '#222222',

        '--ion-color-step-50': '#1e1e1e',
        '--ion-color-step-100': '#2a2a2a',
        '--ion-color-step-150': '#363636',
        '--ion-color-step-200': '#414141',
        '--ion-color-step-250': '#4d4d4d',
        '--ion-color-step-300': '#595959',
        '--ion-color-step-350': '#656565',
        '--ion-color-step-400': '#717171',
        '--ion-color-step-450': '#7d7d7d',
        '--ion-color-step-500': '#898989',
        '--ion-color-step-550': '#949494',
        '--ion-color-step-600': '#a0a0a0',
        '--ion-color-step-650': '#acacac',
        '--ion-color-step-700': '#b8b8b8',
        '--ion-color-step-750': '#c4c4c4',
        '--ion-color-step-800': '#d0d0d0',
        '--ion-color-step-850': '#dbdbdb',
        '--ion-color-step-900': '#e7e7e7',
        '--ion-color-step-950': '#f3f3f3',

        '--ion-item-background': '#1e1e1e',
        '--ion-toolbar-background': '#1f1f1f',
        '--ion-tab-bar-background': '#1f1f1f',
        '--ion-card-background': '#1e1e1e',
      },
    },
};
