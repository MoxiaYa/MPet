// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const electron = require("electron");
// 把ipcRenderer挂载到window上，webview内部的js可以拿到这个模块

window.addEventListener("DOMContentLoaded", () => {
  window.ElectronIpcRenderer = electron.ipcRenderer;
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});
