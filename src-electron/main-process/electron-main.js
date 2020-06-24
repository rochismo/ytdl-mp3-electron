import {
  app,
  BrowserWindow,
  nativeTheme,
  ipcMain,
  globalShortcut,
  Menu
} from "electron";
import Store from "./core/Store";
import createCallbacks from "./modules/ipcCallbacks";
import createMenus from "./modules/builders";
import { autoUpdater } from "electron-updater";
import * as path from "path";

autoUpdater.autoDownload = true;

const time = 1.08e7;

app.setAsDefaultProtocolClient("ytdl");

let mainWindow;
let loading;
let isExitting = false;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  isExitting = true;
  app.quit(0);
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (loading) {
      if (loading.isMinimized()) loading.restore();
      loading.focus();
    } else if (mainWindow) {
      reOpenWindow();
    }
  });

  // Create myWindow, load the rest of the app, etc...
  //app.whenReady().then(displayautoUpdater);
  //app.on("activate", displayautoUpdater);
}
const store = new Store({
  userDataPath: app.getPath("userData"),
  configName: "folder",
  defaults: {
    downloads: app.getPath("music"),
    bitrate: 320
  }
});
const { downloadSong, findVideos, downloadPlaylist } = createCallbacks(store);

try {
  if (
    process.platform === "win32" &&
    nativeTheme.shouldUseDarkColors === true
  ) {
    require("fs").unlinkSync(
      require("path").join(app.getPath("userData"), "DevTools Extensions")
    );
  }
} catch (_) {}

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = require("path")
    .join(__dirname, "statics")
    .replace(/\\/g, "\\\\");
}

ipcMain.on("find-videos", findVideos);

ipcMain.on("download-song", downloadSong);

ipcMain.on("download-playlist", downloadPlaylist);

/*
ipcMain.on("update-playlist", (event, data) => {
  const {downloads} = store.parseDataFile();
  const fileName = `${sanitize(data.video.title)}.mp3`;
  const playlistPath = join(downloads, data.name);
  const playlistDataPath = join(playlistPath, "playlist.json");
  if (!fs.existsSync(playlistPath) || !fs.existsSync(playlistDataPath)) {
    return
  }
  const playlistFilePath = join(playlistPath, fileName);
  console.log(playlistFilePath)
  if (!fs.existsSync(playlistFilePath)) {
    return;
  }
  fs.unlinkSync(playlistFilePath);
  fs.writeFileSync(playlistDataPath, JSON.stringify(data.playlist))
});
*/

async function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    frame: false,
    useContentSize: true,
    webPreferences: {
      // Change from /quasar.conf.js > electron > nodeIntegration;
      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration: true,
      nodeIntegrationInWorker: true

      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      // preload: path.resolve(__dirname, 'electron-preload.js')
    }
  });
  const { mainMenu, systray } = createMenus(mainWindow);
  const template = await mainMenu(store);
  Menu.setApplicationMenu(template);

  mainWindow.loadURL(process.env.APP_URL);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function loadError(error) {
  console.log(error);
  if (loading) {
    loading.webContents.send("update-not-found");
  }
  setTimeout(() => {
    if (!mainWindow) {
      createWindow();
    }

    if (loading) {
      loading.close();
    }
  }, 2000);
}

autoUpdater.on("error", loadError);
autoUpdater.on("update-downloaded", () => {
  autoUpdater.quitAndInstall(true, true);
});
autoUpdater.on("update-available", () => {
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  loading.webContents.send("update-available");
});

autoUpdater.on("update-not-available", () => {
  loading.webContents.send("no-updates");
  setTimeout(() => {
    if (!mainWindow) {
      createWindow();
    }
    loading.close();
  }, 2000);
});

autoUpdater.on("download-progress", ({ percent, transferred, total }) => {
  loading.webContents.send("downloading-update", percent);
});
app.on("ready", () => {
  loading = new BrowserWindow({
    width: 400,
    height: 500,
    show: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  loading.once("show", () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
  // We are done, load electron
  loading.on("close", () => {
    loading = null;
  });
  loading.loadURL(path.join(__statics, "load-bar/index.html"));
  loading.show();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("before-quit", () => {
  globalShortcut.unregisterAll();
});

setInterval(async () => {
  try {
    const data = await autoUpdater.checkForUpdates();
    console.log(data);
  } catch (e) {
    console.log(e);
  }
}, time);
