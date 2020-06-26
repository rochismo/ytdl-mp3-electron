<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
const customTitlebar = require("custom-electron-titlebar");
const remote = require("electron").remote;
const path = require("path");
const url = require("url");
addEventListener("load", () => {
  new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex("#414141"),
    icon: url.format(path.join(__statics.replace("app.asar", "app.asar.unpacked"), "favicon.ico")),
    drag: true
  });
});
export default {
  name: "MainLayout"
};
</script>
