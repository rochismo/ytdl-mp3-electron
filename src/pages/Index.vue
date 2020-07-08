<template>
  <q-page class="flex">
    <div class="col row q-pt-lg q-px-lg">
      <div class="col-md-4 col-sm-12 q-px-md items-start justify-center">
        <q-list dark dense>
          <q-input
            v-model="playlistName"
            placeholder="Enter your playlist's name"
            dark
            style="font-size:2em"
            input-class="text-center"
            class="q-px-lg q-mb-md text-center"
            @input="saveName()"
          />
          <q-item-section v-if="playlist.length">
            <q-item-label header class="text-center text-h5">Videos to download</q-item-label>
            <q-item-label caption class="text-center q-mb-sm" style="font-size: 1rem;">
              {{ playlist.length === 1 ? '1 Video' : `${playlist.length} Videos` }}
              <div
                v-if="playlistDownloading"
              >Videos downloaded {{videosDownloaded}}/{{playlist.length}}</div>
            </q-item-label>
          </q-item-section>

          <q-separator />
          <q-scroll-area
            :thumb-style="thumbStyle"
            :style="$q.screen.sm ? 'height: 50vh' : 'height: 67vh;'"
          >
            <div v-for="video in playlist" :key="video.id">
              <q-item tag="label" v-ripple @click="downloadSong(video)">
                <q-item-section side top class="q-mt-md">
                  <div class="flex items-align q-mt-sm">
                    <q-checkbox v-model="video.checked"></q-checkbox>

                    <q-icon
                      name="delete"
                      color="red"
                      style="cursor: pointer"
                      size="50px"
                      @click.stop="addToPlaylist(video)"
                    />
                  </div>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ video.title }}</q-item-label>
                  <q-item-label caption>{{video.duration}}</q-item-label>
                </q-item-section>
                <q-item-section avatar top class="q-pb-sm">
                  <q-avatar rounded size="90px">
                    <img :src="video.thumbnail" />
                  </q-avatar>
                </q-item-section>
              </q-item>
              <q-separator spaced />
            </div>
          </q-scroll-area>
          <div class="text-center" v-if="playlist.length">
            <q-btn
              label="Download Playlist"
              color="orange-9"
              icon="get_app"
              class="q-mb-lg q-mt-md q-mr-md"
              @click="downloadPlaylist()"
            />
            <q-btn
              label="Remove playlist"
              color="negative"
              icon="delete"
              class="q-mb-lg q-mt-md q-mr-md"
              @click="emptyPlaylist()"
            />
            <q-btn
              label="Remove selected"
              color="negative"
              icon="delete"
              class="q-mb-lg q-mt-md"
              @click="sendRemoveSelected(playlist.filter(({checked}) => checked).length)"
            />
          </div>
        </q-list>
        <div class="text-center"></div>
      </div>
      <div class="col-md-8 col-sm-12">
        <q-form class="col row justify-center">
          <q-input
            v-model="search"
            dark
            input-class="text-center"
            placeholder="Search something on YouTube"
            style="width: 100%; font-size: 2em"
            :error="!!message"
            :error-message="message"
            @keypress.enter.prevent="searchVideos"
          >
            <template v-slot:append>
              <q-icon name="search" @click.stop.prevent="searchVideos" style="cursor: pointer" />
            </template>
          </q-input>
          <q-ajax-bar ref="bar" position="bottom" color="red" size="10px" skip-hijack />
        </q-form>
        <q-scroll-area style="height: 90vh" :thumb-style="thumbStyle">
          <div class="q-pa-md row items-start q-gutter-md justify-center">
            <q-card class="my-card" v-for="video in videos" :key="video.id">
              <q-img :src="video.thumbnail" basic>
                <div
                  class="absolute-bottom text-h6 overflow-hidden"
                >{{video.title}} - {{ video.duration }}</div>
              </q-img>

              <q-card-section
                class="overflow-hidden"
                style="height: 100px"
              >{{ video.description || "No description"}}</q-card-section>
              <q-card-actions align="stretch" :vertical="true" class="q-pa-md">
                <q-btn
                  label="Download as mp3"
                  color="orange-9"
                  icon="get_app"
                  @click="downloadSong(video)"
                ></q-btn>
                <q-btn
                  class="q-mb-md"
                  :label="!isInPlaylist(video) ? 'Add to Playlist' : 'Remove from playlist'"
                  color="orange-9"
                  :icon="!isInPlaylist(video) ? 'playlist_add' : 'delete'"
                  @click="addToPlaylist(video)"
                ></q-btn>
              </q-card-actions>
            </q-card>
          </div>
        </q-scroll-area>
      </div>
    </div>
  </q-page>
</template>

<script>
const { ipcRenderer, shell } = require("electron");
const defaultPlaylistName = "Default Playlist";
export default {
  name: "PageIndex",
  data() {
    return {
      thumbStyle: {
        right: "2px",
        borderRadius: "5px",
        width: "5px",
        opacity: 0.75
      },
      defaultValue: false,
      playlistDownloading: false,
      videosDownloaded: 0,
      message: "",
      search: "",
      progress: 0,
      videos: JSON.parse(localStorage.getItem("videos")) || [],
      playlistName: localStorage.getItem("playlist-name") || "",
      playlist: JSON.parse(localStorage.getItem("playlist")) || []
    };
  },
  created() {
    this.$q.dark.set(true);
    ipcRenderer.on("videos", (event, data) => {
      this.videos = data;
      localStorage.setItem("videos", JSON.stringify(data));
    });

    ipcRenderer.on("load-playlist", (ev, { playlist, name }) => {
      this.playlist = playlist;

      this.playlistName = name === defaultPlaylistName ? "" : name;
      localStorage.setItem("playlist", JSON.stringify(playlist));
      localStorage.setItem("playlist-name", this.playlistName);
    });

    ipcRenderer.on("progress", (e, data) => {
      if (data.isPlaylist) {
        this.videosDownloaded = data.amount;
      }
      this.progress = data.progress;
    });
    ipcRenderer.on("close-progress", (ev, removePlaylist = false) => {
      if (removePlaylist) {
        this.playlist = [];
        localStorage.setItem("playlist", JSON.stringify(this.playlist));
      }
      this.startAjax = false;
      this.playlistDownloading = false;
      this.videosDownloaded = 0;
      setTimeout(() => {
        this.progress = 0;
      }, 1000);
    });
    ipcRenderer.on("error", (ev, msg) => alert(msg));
  },
  watch: {
    progress(progress) {
      if (!this.startAjax) {
        this.startAjax = true;
        this.$refs.bar.start();
      }
      if (!progress && this.startAjax) {
        this.$refs.bar.stop();
        this.startAjax = false;
      }
      this.$refs.bar.progress = progress;
    }
  },
  methods: {
    async searchVideos() {
      ipcRenderer.send("find-videos", this.search);
    },
    async addToPlaylist(video) {
      const found = this.isInPlaylist(video);
      if (found) {
        return this.$q
          .dialog({
            title: "Confirm deletion",
            message: "Remove this video from the playlist?",
            cancel: true
          })
          .onOk(() => this.deleteVideo(video));
      }
      video.isAdded = true;
      video.checked = false;
      this.playlist.push(video);
      localStorage.setItem("playlist", JSON.stringify(this.playlist));
    },
    emptyPlaylist() {
      if (!this.playlist.length) return;
      this.$q
        .dialog({
          title: "Confirm deletion",
          message: "Are you sure you want to remove the entire playlist?",
          cancel: true
        })
        .onOk(() => {
          this.playlist = [];
          this.playlistName = "";
          localStorage.setItem("playlist", JSON.stringify(this.playlist));
          localStorage.setItem("playlist-name", "");
        });
    },
    downloadPlaylist(remove = false) {
      if (this.startAjax) return;

      this.playlistDownloading = true;
      const name = this.playlistName || defaultPlaylistName;
      if (name !== defaultPlaylistName) {
        localStorage.setItem("playlist-name", name);
      }
      ipcRenderer.send("download-playlist", {
        playlist: this.playlist,
        name,
        remove
      });
    },
    isInPlaylist(video) {
      const found = this.playlist
        .map(({ id }) => id)
        .find(id => id === video.id);
      return found;
    },
    deleteVideo(video) {
      const index = this.playlist.findIndex(wideo => wideo.id === video.id);
      this.playlist.splice(index, 1);
      video.isAdded = false;
      localStorage.setItem("playlist", JSON.stringify(this.playlist));
    },
    downloadSong(video) {
      if (this.startAjax) return;
      ipcRenderer.send("download-song", video);
    },
    openRemoteBrowser() {
      shell.openExternal("https://google.com");
    },
    saveName() {
      localStorage.setItem("playlist-name", this.playlistName);
    },
    sendRemoveSelected(amount) {
      if (amount === 0) return;
      const message =
        amount === this.playlist.length
          ? "Remove the entire playlist?"
          : `Remove ${amount} video${amount > 1 ? "s" : ""} from the playlist?`;
      this.$q
        .dialog({
          title: "Confirm deletion",
          message,
          cancel: true
        })
        .onOk(() => {
          this.playlist = this.playlist.filter(({ checked }) => !checked);
          localStorage.setItem("playlist", JSON.stringify(this.playlist));
          if (message === "Remove the entire playlist?") {
            this.playlistName = "";
            localStorage.setItem("playlist-name", "")
          }
        });
    }
  }
};
</script>


<style lang="scss" scoped>
.overflow-hidden {
  text-overflow: hidden;
}
#add-to-playlist:hover {
  color: yellow;
}
</style>
<style lang="sass" scoped>
.my-card
  width: 100%
  height: 480px
  max-width: 350px
</style>
