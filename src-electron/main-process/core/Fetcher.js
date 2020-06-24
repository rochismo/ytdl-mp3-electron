import Video from './Video';
const youtube = require("scrape-youtube").default;
class Fetcher {
  async find(param) {
    try {
      const results = await youtube.search(param, {limit: 20});
      return results.map(Video.fromVideo)
    } catch (e) {
      throw e;
    }
  }

}

export default new Fetcher();
