import { app, ipcMain, Notification, shell, BrowserWindow, NotificationConstructorOptions, remote } from 'electron';
import { createCapacitorElectronApp } from "@capacitor-community/electron";

const DownloadManager = require("electron-download-manager");
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
const myCapacitorApp = createCapacitorElectronApp();

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
      const notification: NotificationConstructorOptions = {
        title: args.header,
        body: args.message,
        icon: path.join(__dirname, '../assets/appIcon.png'),
        urgency: 'critical'
      }
      new Notification(notification).show();
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
