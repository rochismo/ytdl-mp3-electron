import { Menu, app, dialog } from "electron";
import * as fs from "fs-extra";
import locales from './../locales';
import {join, parse} from 'path';
const oslocale = require("os-locale");
const sanitize = require("sanitize-filename");

function openDialog(locales, store, mainWindow) {
  const { downloads } = store.parseDataFile();
  const folder = dialog.showOpenDialogSync(mainWindow, {
    title: locales.selectFile,
    defaultPath: downloads,
    filters: [
      {
        name: "playlist",
        extensions: ["json"]
      }
    ],
    properties: ["openDirectory", "dontAddToRecent"]
  });
  if (!folder || !mainWindow) return;
  const [playlistPath] = folder;

  const fullPath = join(playlistPath, "playlist.json");
  if (!fs.existsSync(fullPath)) {
    dialog.showErrorBox(locales.playlistError, locales.playlistErrorMessage);
    return;
  }
  cleanMeta(playlistPath, fullPath);
  const name = parse(playlistPath).name;
  const playlist = JSON.parse(fs.readFileSync(fullPath).toString());
  mainWindow.webContents.send("load-playlist", { playlist, name });
  cleanMeta(playlistPath, fullPath);
}

export default function(mainWindow) {
  return {
    systray() {
      const template = [
        {
          label: "Exit",
          click() {
            isExitting = true;
            app.quit(0);
          }
        },
        {
          label: "Open",
          click() {
            reOpenWindow();
          }
        },
        {
          label: "Open maximized",
          click() {
            reOpenWindow();
            mainWindow.maximize();
          }
        }
      ];
      return Menu.buildFromTemplate(template);
    },
    async mainMenu(store) {
      const locale = await oslocale();
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
        },
        {
          label: strings.loadPlaylist,
          click: () => {
            openDialog(strings, store, mainWindow);
          }
        }
      ];
      return Menu.buildFromTemplate(template);
    }
  };
}
