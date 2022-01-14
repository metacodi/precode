import { app, ipcMain, shell, BrowserWindow, remote, Menu, globalShortcut } from 'electron';
import { createCapacitorElectronApp, createCapacitorElectronDeepLinking } from "@capacitor-community/electron";

const contextMenu = require('electron-context-menu');
const DownloadManager = require("electron-download-manager");
const path = require('path');
const fs = require('fs');
const downloadFolder = app.getPath('downloads');
const gotTheLock = app.requestSingleInstanceLock();

// Para controlar las ventas secundarias como el pago
let openWin;
/** Indica si la aplicación actualmente tiene el foco. */
let focused = false;

DownloadManager.register({
  downloadFolder
});

const isMac = process.platform === 'darwin';
const appPath = app.getAppPath().replace('/app.asar', '');
// The MainWindow object can be accessed via myCapacitorApp.getMainWindow()

const myCapacitorApp = createCapacitorElectronApp({
  applicationMenuTemplate: [
    { role: 'appMenu' },
    { role: 'editMenu' },
    { role: 'windowMenu' },
    // {
    //   label: 'File',
    //   submenu: [
    //     {
    //       label: 'Save',
    //       accelerator: 'CommandOrControl+S',
    //       click: async () => { myCapacitorApp.getMainWindow().webContents.send('saveRow'); }
    //     }
    //   ]
    // },
  ],
  splashScreen: {
    splashOptions: {
      imageFilePath: path.join(appPath, isMac ? '../assets/splash.png' : '../../assets/splash.png')
    }
  },
  // splashScreen: {
  //   useSplashScreen: false,
  // },
  mainWindow: {
    windowOptions: {
      show: null,
      height: 1200,
      width: 1900,
    }
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some Electron APIs can only be used after this event occurs.

if (!gotTheLock) {
  app.quit();
} else {

  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    // const mainWindow = remote.BrowserWindow.getAllWindows();
    if (myCapacitorApp.getMainWindow()) {
      if (myCapacitorApp.getMainWindow().isMinimized()) { myCapacitorApp.getMainWindow().restore(); }
      myCapacitorApp.getMainWindow().focus();
    }
  });

  app.on("ready", () => {
    myCapacitorApp.init();

    ipcMain.handle('setContextMenu', async (event, args) => {
      // Crea menu contextual
      contextMenu({
        prepend: (defaultActions, params, browserWindow) => [
          // {
          //   label: 'Rainbow',
          //   // Only show it when right-clicking images
          //   visible: params.mediaType === 'image'
          // },
          // {
          //   label: 'Search Google for “{selection}”',
          //   // Only show it when right-clicking text
          //   visible: params.selectionText.trim().length > 0,
          //   click: () => {
          //     shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`);
          //   }
          // },
        ],
        showLookUpSelection: false,
        showSearchWithGoogle: false,
        showCopyImage: false,
        labels: args.labels,
      });
    });

    ipcMain.handle('setMenuApp', async (event, args) => {

      // const extras: any = args.map(function(ele){
      //   const section: any = {
      //     label: ele.label,
      //     submenu: ele.submenu.map(function(subEle){
      //       const subMenu  = {
      //         label: subEle.label,
      //         click: async () => { myCapacitorApp.getMainWindow().webContents.send('navigate', subEle.navigate); }
      //         }
      //       return subMenu;
      //     })
      //   }
      //   return section;
      // });


      // Menu.setApplicationMenu(Menu.buildFromTemplate(args));

      // const extras: any = {
      //   label: 'Inicio',
      //   submenu: [
      //     { label: 'MyPerfil',
      //       click: async () => { myCapacitorApp.getMainWindow().webContents.send('navigate', '/mi-perfil'); }
      //    },
      //   ]
      // } 

      Menu.setApplicationMenu(Menu.buildFromTemplate([
        { role: 'appMenu' },
        { role: 'editMenu' },
        { role: 'windowMenu' }
      ]));

      // const isMac = process.platform === 'darwin';

      // const template = 

      //   {
      //     label: 'Editar',
      //     submenu: [
      //       { role: 'undo' },
      //       { role: 'redo' },
      //       { type: 'separator' },
      //       { role: 'cut' },
      //       { role: 'copy' },
      //       { role: 'paste' },
      //     ]
      //   }

      // const menu = Menu.buildFromTemplate(template)
      // Menu.setApplicationMenu(menu)
    });


  });

  app.on('browser-window-focus', () => {
    myCapacitorApp.getMainWindow().webContents.send('browser-window-focus');
  })
  app.on('browser-window-blur', () => {
    myCapacitorApp.getMainWindow().webContents.send('browser-window-blur');
  })

  // app.on('active', () => {
  //   myCapacitorApp.getMainWindow().webContents.send('active');
  // });

  // Quit when all windows are closed.
  app.on("window-all-closed", function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on('will-quit', () => {
    
    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
  })

  app.on("activate", function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (myCapacitorApp.getMainWindow().isDestroyed()) myCapacitorApp.init();
  });
}
// Define any IPC or other custom functionality below here
