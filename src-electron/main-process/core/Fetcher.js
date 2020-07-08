import Video from "./Video";
const youtube = require("scrape-youtube").default;
const moment = require("moment");

class Fetcher {
  async find(param) {
    try {
      const results = await youtube.search(param, { limit: 20 });
      return results.map(video => {
        const createdVideo = Video.fromVideo(video);

        createdVideo.duration = moment("2015-01-01").startOf('day')
        .seconds(createdVideo.duration)
        .format('H:mm:ss');
        createdVideo.duration = this.parseDate(createdVideo.duration);
        return createdVideo;
      });
    } catch (e) {
      throw e;
    }
  }
  parseDate(date) {
    let format = date.split(":").reduce((formattedDate, nextValue) => {
      if (!parseInt(nextValue, 10)) {
        return formattedDate;
      }
      formattedDate += `${nextValue}:`
      return formattedDate;
    }, "");
    return format.substring(0, format.length - 1);
  }
}

export default new Fetcher();
