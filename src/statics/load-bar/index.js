const progressBar = document.querySelector("#fill");
const loadingText = document.querySelector("#loadingText");
const progressText = document.querySelector("#progress");
const mainText = document.querySelector(".main-text");
const progressContainer = document.querySelector("#container");

const ipcRenderer = require("electron").ipcRenderer;
ipcRenderer.on("downloading-update", (ev, percentage) => {
    const formatted = `${Math.round(percentage)}%`;
    progressBar.style.width = formatted;
    progressText.innerText = formatted;
});

ipcRenderer.on("no-updates", (ev) => {
    mainText.innerText = "No updates available";
})

ipcRenderer.on("update-available", ev => {
    progressContainer.style.display = "block";
    loadingText.innerText = "Downloading"
    mainText.innerText = "Downloading update";
})

ipcRenderer.on("update-not-found", () => {
    mainText.innerText = "Update not found";
})