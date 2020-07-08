
class Video {
  constructor(video) {
    this.id = video.id;
    this.channel = video.channel;
    this.checked = false;
    this.description = video.description;
    this.duration = parseInt(video.duration);
    this.title = video.title;
    this.thumbnail = video.thumbnail;
    this.checked = false;
  }
  static fromVideo(video) {
    return new Video(video);
  }

  static fromYtdlCore(video) {
    
  }
}

export default Video;
