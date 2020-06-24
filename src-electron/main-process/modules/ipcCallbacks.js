import { join } from "path";
import * as fs from "fs-extra";
import fetcher from "./../core/Fetcher";

import {
  validateURL,
  getBasicInfo,
  validateID,
  getURLVideoID
} from "ytdl-core";

import Downloader from "./../core/Downloader";

const { allProgress, updateDuplicates } = require("./helpers").default;
const { cleanMeta } = require("./helpers").default;
export default function(store) {
  console.log(store);
  return {
    downloadSong: async (event, video) => {
      const downloader = new Downloader();
      await downloader.download(
        video,
        event,
        store.parseDataFile().downloads,
        store.parseDataFile().bitrate
      );
    },

    findVideos: async (event, query) => {
      if (validateURL(query)) {
        const id = getURLVideoID(query);
        const info = await getBasicInfo(query);
        const title = info.title;
        return this.downloadSong(event, { id, title });
      }

      event.sender.send("progress", { progress: 1 });
      let results = await fetcher.find(query);
      event.sender.send("progress", { progress: 25 });

      if (!results.length) {
        results = await fetcher.find(query);
        event.sender.send("progress", { progress: 50 });
      }
      event.sender.send("progress", { progress: 100 });
      event.sender.send("close-progress");
      event.sender.send("videos", results);
    },

    downloadPlaylist: async (ev, data) => {
      try {
        const { downloads, bitrate } = store.parseDataFile();
        const fullPath = join(downloads, data.name);
        const metaPath = join(fullPath, `playlist.json`);

        cleanMeta(fullPath, metaPath);

        const promises = data.playlist.map(video =>
          new Downloader().download(video, ev, downloads, bitrate, data.name)
        );
        let meta = [];

        await allProgress(promises, data =>
          ev.sender.send("progress", {
            progress: parseInt(data.progress),
            amount: data.amount,
            isPlaylist: true
          })
        );

        if (fs.existsSync(metaPath)) {
          meta = JSON.parse(fs.readFileSync(metaPath).toString());
        }
        meta = updateDuplicates(meta, data.playlist);
        fs.writeFileSync(metaPath, JSON.stringify(meta));
        cleanMeta(fullPath, metaPath);
        ev.sender.send("close-progress", data.remove);
      } catch (e) {
        console.log(e);
      }
    }
  };
}
