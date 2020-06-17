const ffmpeg = require("fluent-ffmpeg");
const binaries = require("ffmpeg-static");
const sanitize = require("sanitize-filename");
const ytdl = require("ytdl-core");
const fs = require("fs-extra");
const path = require("path");
const progress = require("progress-stream");

export default class Downloader {
  async download(video, event, downloadsPath, bitrate, isPlaylist = false) {
    return new Promise(async resolve => {
      const title = sanitize(video.title);
      const videoUrl = `https://youtube.com/watch?v=${video.id}`;
      try {
        const fileName = path.join(downloadsPath, `${title}.mp3`);
        const info = await ytdl.getInfo(videoUrl, { quality: "highest" });
        const stream = ytdl.downloadFromInfo(info, { quality: "highest" });
        stream.on("response", response => {
          const progressStream = progress({
            length: parseInt(response.headers["content-length"]),
            time: 200
          });

          progressStream.on("progress", progress => {
            if (!isPlaylist) {
              event.sender.send("progress", parseInt(progress.percentage));
            }
          });
          const outputOptions = [
            "-id3v2_version",
            "4",
            "-metadata",
            "title=" + title
          ];
          const ffmpegStream = ffmpeg({
            source: stream.pipe(progressStream)
          })
            .setFfmpegPath(binaries)
            .audioBitrate(bitrate)
            .withAudioCodec("libmp3lame")
            .toFormat("mp3")
            .outputOptions(...outputOptions)
            .on("error", e => {
              console.log(e);
              if (!isPlaylist) {
                event.sender.send("error", `Error with song ${title}`);
              }
              resolve();
            })
            .on("end", () => {
              if (!isPlaylist) {
                event.sender.send("close-progress");
              }
              resolve();
            })
            .saveToFile(fileName);
        });
      } catch (e) {
        console.log(e)
        resolve();
        return event.sender.send("error", "Video is not available");
      }
    });
  }
}
