class Video {
  constructor(video) {
    this.id = video.id;
    this.channel = video.channel;
    this.checked = false;
    this.description = video.description;
    this.duration = this.formatDuration(parseInt(video.duration));
    this.title = video.title;
    this.thumbnail = video.thumbnail;
    this.checked = false;
  }
  formatDuration(duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes < 10 ? `0${minutes}` : minutes}:${
      seconds < 10 ? `0${seconds}` : seconds
    }`;
  }
  static fromVideo(video) {
    return new Video(video);
  }

  static fromYtdlCore(video) {
    
  }
}

export default Video;
