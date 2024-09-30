import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.metacodi.taxi',
  appName: 'LogicTaxi',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#000000',
    },
    // NOTA: Aquesta línia s'ha d'escriure literalment com està pq des de precode es fa un replace per el compilat d'electron.
    // TODO: Utilitzar TypescriptParser a precode per eliminar aquesta propietat de manera consistent.
    // Keyboard: { resize: KeyboardResize.Ionic },
  },
  // NOTA: Aquesta línia s'ha d'escriure literalment com està pq des de precode es fa un replace per el compilat d'electron.
  // TODO: Utilitzar TypescriptParser a precode per eliminar aquesta propietat de manera consistent.
  ios: {
    preferredContentMode: 'mobile'
  }
};

export default config;
