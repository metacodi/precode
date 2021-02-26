import { app, ipcMain, Notification, shell, BrowserWindow, NotificationConstructorOptions, remote, Menu } from 'electron';
import { createCapacitorElectronApp, createCapacitorElectronDeepLinking } from "@capacitor-community/electron";

const contextMenu = require('electron-context-menu');
const DownloadManager = require("electron-download-manager");
const Badge = require('electron-windows-badge');
const path = require('path');
const fs = require('fs');
const downloadFolder = app.getPath('downloads');
const gotTheLock = app.requestSingleInstanceLock();

// Para controlar las ventas secundarias como el pago
let openWin;

DownloadManager.register({
  downloadFolder
});

// The MainWindow object can be accessed via myCapacitorApp.getMainWindow()
const myCapacitorApp = createCapacitorElectronApp({
  applicationMenuTemplate: [
    { role: 'appMenu' },
    { role: 'editMenu' },
    { role: 'windowMenu' }
  ],
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

    ipcMain.handle('downloadApp', async (event, urlApp) => {

      const options = Object.assign({}, { path: '' }, urlApp);
      const filename = decodeURIComponent(path.basename(urlApp));
      const filePath = path.join(downloadFolder, options.path.toString(), filename.split(/[?#]/)[0]);

      if (await fs.existsSync(filePath)) { await fs.unlinkSync(filePath); }

      DownloadManager.download({ url: urlApp }, function (error, info) {
        if (error) {
          console.log(error);
          return;
        }
        shell.showItemInFolder(filePath);
        app.quit();
      });
    });

    ipcMain.handle('sendNotification', async (event, args: any) => {

      // Necesrio para que las notificaciones en windows se vea correctamente el título de la aplicación
      if (process.platform === 'win32') {
        app.setAppUserModelId(args.appId);
      }

      const notificationOptions: NotificationConstructorOptions = {
        title: args.header,
        body: args.message,
        icon: path.join(__dirname, '../assets/appIcon.png'),
        urgency: 'critical'
      }
      const notification = new Notification(notificationOptions);
      notification.show();
      notification.on('click', () => {
        myCapacitorApp.getMainWindow().webContents.send('notificationClick', args.notified);
      });
    });

    ipcMain.handle('openWindow', async (event, url) => {
      openWin = new BrowserWindow({ width: 800, height: 600 });
      // Load a remote URL
      openWin.loadURL(url);
      openWin.on('closed', () => {
        myCapacitorApp.getMainWindow().webContents.send('window-closed', url);
      });
      return true;
    });

    ipcMain.handle('closeOpendWindow', async (event, url) => {
      openWin.close();
    });

    ipcMain.handle('appQuit', async (event, shortCuts: string[]) => {
      app.quit();
    });

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

    // Badge for Mac / Linux
    ipcMain.handle('setBatge', async (event, counter) => {
      app.setBadgeCount(counter);
    });

    // Badge for windows
    ipcMain.handle('update-badge', async (event, counter) => {
      const badge = new Badge(myCapacitorApp.getMainWindow(), {});
      badge.update(counter);
    });

  });

  // Quit when all windows are closed.
  app.on("window-all-closed", function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (myCapacitorApp.getMainWindow().isDestroyed()) myCapacitorApp.init();
  });
}
// Define any IPC or other custom functionality below here
