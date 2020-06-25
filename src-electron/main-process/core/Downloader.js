import * as fs from "fs-extra";

const ffmpeg = require("fluent-ffmpeg");
const log = require("electron-log")
const sanitize = require("sanitize-filename");
const ytdl = require("ytdl-core");
const mkdir = require("mkdirp");
const path = require("path");
const progress = require("progress-stream");

export default class Downloader {
  async download(video, event, downloadsPath, bitrate, playlistName) {
    return new Promise(async resolve => {
      const title = sanitize(video.title);
      const videoUrl = `https://youtube.com/watch?v=${video.id}`;
      try {
        if (playlistName) {
          playlistName = sanitize(playlistName);
          downloadsPath = path.join(downloadsPath, playlistName);
          if (!fs.existsSync(downloadsPath)) {
            fs.ensureDirSync(downloadsPath)
          }
        }
        const fileName = path.join(downloadsPath, `${title}.mp3`);
        if (fs.existsSync(fileName)) return resolve();
        const info = await ytdl.getInfo(videoUrl, { quality: "highest" });
        const stream = ytdl.downloadFromInfo(info, { quality: "highest" });
        stream.on("response", response => {
          const progressStream = progress({
            length: parseInt(response.headers["content-length"]),
            time: 200
          });
          progressStream.on("progress", progress => {
            if (!playlistName) {
              event.sender.send("progress", {progress: parseInt(progress.percentage)});
            }
          });
          const outputOptions = [
            "-id3v2_version",
            "4",
            "-metadata",
            "title=" + title
          ];
          log.info(__statics.replace("app.asar", "app.asar.unpacked"))
          console.log(bitrate)
          const ffmpegStream = ffmpeg({
            source: stream.pipe(progressStream)
          })
            .setFfmpegPath(path.join(__statics.replace("app.asar", "app.asar.unpacked"), "ffmpeg.exe"))
            .audioBitrate(bitrate)
            .withAudioCodec("libmp3lame")
            .toFormat("mp3")
            .outputOptions(...outputOptions)
            .on("error", e => {
              log.error(e);
              if (!playlistName) {
                event.sender.send("error", `Error with song ${title}`);
              }
              resolve();
            })
            .on("end", () => {
              if (!playlistName) {
                event.sender.send("close-progress");
              }
              resolve();
            })
            .saveToFile(fileName);
        });
      } catch (e) {
        log.error(e);
        resolve();
        return event.sender.send("error", "Video is not available");
      }
    });
  }
}
