import * as fs from 'fs-extra';
const sanitize = require("sanitize-filename")
export default {
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";

    const kilobyte = 1024;
    const parsedDecimals = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const amountOfMegaBytes = Math.floor(Math.log(bytes) / Math.log(kilobyte));
    return (
      parseFloat(
        (bytes / Math.pow(kilobyte, amountOfMegaBytes)).toFixed(parsedDecimals)
      ) +
      " " +
      sizes[amountOfMegaBytes]
    );
  },
  allProgress(proms, progress_cb) {
    let d = 0;
    progress_cb({ amount: d, progress: 0 });
    for (const p of proms) {
      p.then(() => {
        d++;
        progress_cb({ amount: d, progress: (d * 100) / proms.length });
      });
    }
    return Promise.all(proms);
  },
  updateDuplicates(main, second) {
    const mainIds = main.map(({ id }) => id);
    const secondIds = second
      .map(({ id }) => id)
      .filter(id => !mainIds.includes(id));
    const newItems = second.filter(({ id }) => secondIds.includes(id));
    return main.concat(newItems);
  },
  cleanMeta(fullPath, metaPath) {
    if (!fs.existsSync(fullPath)) return;
    if (!fs.existsSync(metaPath)) return;
    const meta = JSON.parse(fs.readFileSync(metaPath).toString());
    const folderContents = fs.readdirSync(fullPath);
    const names = meta.map(({ title }) => `${sanitize(title)}.mp3`);
    const nonExistingNames = names.filter(name => !folderContents.includes(name));
    if (!nonExistingNames.length) return;
    const newMeta = meta
      .map(video => {
        video.name = `${sanitize(video.title)}.mp3`;
        return video;
      })
      .filter(({ name }) => !nonExistingNames.includes(name));
    fs.writeFileSync(metaPath, JSON.stringify(newMeta));
  }
};
