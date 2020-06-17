<template>
  <q-page class="flex flex-center">
    <div class="col q-pt-lg q-px-lg">
      <q-form class="col row justify-center">
        <q-input
          v-model="search"
          dark
          placeholder="Search"
          style="width: 100%"
          :error="!!message"
          :error-message="message"
          @keypress.enter.prevent="searchVideos"
        >
          <template v-slot:append>
            <q-icon name="search" @click.stop.prevent="searchVideos" />
          </template>
        </q-input>
        <q-ajax-bar ref="bar" position="bottom" color="red" size="10px" skip-hijack />
      </q-form>
      <div class="q-pa-md items-start justify-center" v-if="playlist.length">
        <q-list class="bg-blue-10" dark dense>
          <q-item-label header class="text-center text-h5">Videos to download</q-item-label>
          <q-separator />
          <q-scroll-area :thumb-style="thumbStyle" style="height: 150px;">
            <div v-for="video in playlist" :key="video.id">
              <q-item tag="label" v-ripple>
                <q-item-section side top class="q-mt-md">
                  <q-icon
                    name="delete"
                    color="red"
                    style="cursor: pointer"
                    size="50px"
                    @click="addToPlaylist(video)"
                  />
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
        </q-list>
        <div class="text-center">
          <q-btn
            label="Download Playlist"
            color="positive"
            icon="cloud_download"
            class="q-mt-sm"
            @click="downloadPlaylist()"
          />
        </div>
      </div>
      <div class="q-pa-md row items-start q-gutter-md justify-center">
        <q-card class="my-card" v-for="video in videos" :key="video.id">
          <q-img :src="video.thumbnail" basic>
            <div
              class="absolute-bottom text-h6 overflow-hidden"
            >{{video.title}} - {{ video.duration }}</div>
          </q-img>

          <q-card-section class="overflow-hidden">{{ video.description}}</q-card-section>
          <q-card-actions align="stretch" :vertical="true" class="q-pa-md">
            <q-btn
              label="Download as mp3"
              color="primary"
              icon="cloud_download"
              @click="downloadSong(video)"
            ></q-btn>
            <q-btn
              class="q-mb-md"
              :label="video.isAdded === undefined || !video.isAdded ? 'Add to Playlist' : 'Remove from playlist'"
              color="primary"
              icon="playlist_add"
              @click="addToPlaylist(video)"
            ></q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
const { ipcRenderer } = require("electron");

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
      message: "",
      search: "",
      progress: 0,
      videos: [],
      playlist: []
    };
  },
  created() {
    ipcRenderer.on("videos", (event, data) => {
      this.videos = data;
    });

    ipcRenderer.on("change-downloads-folder", ev => {
      this.openFilePickerDialog = true;
    });

    ipcRenderer.on("progress", (e, progress) => {
      if (!progress) return;
      this.progress = progress;
    });
    ipcRenderer.on("close-progress", () => {
      this.startAjax = false;
      setTimeout(() => {
        this.progress = 0;
      }, 1000);
    });
    ipcRenderer.on("error", (ev, msg) => alert(msg))
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
      const found = this.playlist.find(wideo => wideo.id === video.id);
      if (found) {
        return this.$q
          .dialog({
            title: "Confirm deletion",
            message: "Remove this video from the playlist?",
            cancel: true
          })
          .onOk(() => {
            const index = this.playlist.findIndex(
              wideo => wideo.id === video.id
            );
            this.playlist.splice(index, 1);
            video.isAdded = false;
          });
      }
      video.isAdded = true;
      this.playlist.push(video);
    },
    downloadPlaylist() {
      ipcRenderer.send("download-playlist", this.playlist);
    },
    downloadSong(video) {
      ipcRenderer.send("download-song", video);
    }
  }
};
</script>


<style lang="scss" scoped>
.q-page {
  background: linear-gradient(to bottom, #136a8a, #267871);
}
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
  max-width: 500px
</style>
