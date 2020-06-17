import { app, BrowserWindow, nativeTheme, ipcMain, Menu } from "electron";
import fetcher from "./Fetcher";
import locales from "./locales";
import Store from "./Store";
import Downloader from "./Downloader";

const store = new Store({
  userDataPath: app.getPath("userData"),
  configName: "folder",
  defaults: {
    downloads: app.getPath("downloads"),
    bitrate: 320
  }
});

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

function allProgress(proms, progress_cb) {
  let d = 0;
  progress_cb(1);
  for (const p of proms) {
    p.then(() => {
      d++;
      console.log(d)
      progress_cb((d * 100) / proms.length);
    });
  }
  return Promise.all(proms);
}

function buildTemplate() {
  const locale = Intl.DateTimeFormat()
    .resolvedOptions()
    .locale.toString();
  const strings = locale in locales ? locales[locale] : locales.default;
  let template = [
    {
      label: strings.preferences,
      submenu: [
        {
          label: strings.changeBitrate,
          submenu: [
            {
              label: strings.full,
              click: () => {
                store.set("bitrate", 320);
              }
            },
            {
              label: strings.high,
              click: () => {
                store.set("bitrate", 192);
              }
            },
            {
              label: strings.cd,
              click: () => {
                store.set("bitrate", 160);
              }
            },
            {
              label: strings.radio,
              click: () => {
                store.set("bitrate", 130);
              }
            },
            {
              label: strings.minimal,
              click: () => {
                store.set("bitrate", 65);
              }
            }
          ]
        }
      ]
    }
  ];
  return Menu.buildFromTemplate(template);
}

ipcMain.on("find-videos", async (event, query) => {
  event.sender.send("progress", 1);
  let results = await fetcher.find(query);
  event.sender.send("progress", 25);
  if (!results.length) {
    results = await fetcher.find(query);
    event.sender.send("progress", 50);
  }
  event.sender.send("progress", 100);
  event.sender.send("close-progress");
  event.sender.send("videos", results);
});

ipcMain.on("download-song", async (event, video) => {
  const downloader = new Downloader();
  await downloader.download(
    video,
    event,
    store.parseDataFile().downloads,
    store.parseDataFile().bitrate
  );
});

ipcMain.on("download-playlist", async (ev, playlist) => {
  const {downloads, bitrate} = store.parseDataFile(); 
  const promises = playlist.map(video => new Downloader().download(video, ev, downloads, bitrate, true));
  await allProgress(promises, (progress) => ev.sender.send("progress", parseInt(progress)))
  ev.sender.send("close-progress")
})
let mainWindow;

function createWindow() {
  /**
   * Initial window options
   */
  const template = buildTemplate();
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
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
  Menu.setApplicationMenu(template);

  mainWindow.loadURL(process.env.APP_URL);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

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
