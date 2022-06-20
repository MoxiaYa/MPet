const { app, BrowserWindow, ipcMain, Tray, Menu, dialog } = require("electron");
const path = require("path");
const Server = require("./server");

const IS_LOCAL = true;
const LOCAL_URL = "http://localhost:3000";
const DEV = {
  main: false,
  sys: false,
  pre: false,
};

class Client {
  constructor() {
    this.config = {
      top: true,
      noClick: false,
      width: 600,
      height: 400,
      x: 100,
      y: 100,
    };
    this.sysDialog = null;
    this.preDialog = null;
    this.win = null;
    this.server = new Server(this);
    this.initAppHandler();
  }

  say(info) {
    this.sendToPage("showMessage", info);
  }

  initConfig(config) {
    Object.entries(config).forEach(([k, v]) => {
      this.config[k] = v;
    });
  }

  initMainIpcHandler() {
    ipcMain.on("changeConfig", (e, data) => {
      this.win.setResizable(data.resize);
    });

    ipcMain.on("init", this.handlePageInited.bind(this, this.win));

    ipcMain.on("openPre", (e, data) => {
      this.createPreDialog(data);
    });

    ipcMain.on("closePre", (e, data) => {
      if (this.preDialog) {
        this.preDialog.close();
      }
    });

    ipcMain.on("addModel", (e, data) => {
      const info = this.modelConfigToServer("addModel", data);
      if (info && this.sysDialog) {
        this.sysDialog.webContents.send("addModel", info);
      }
    });

    ipcMain.on("addSay", (e, data) => {
      const info = this.server.addSay(data);
      if (info && this.sysDialog) {
        this.sysDialog.webContents.send("addSay", info);
      }
    });

    ipcMain.on("delModel", (e, data) => {
      if (data) {
        this.modelConfigToServer("delModel", data);
      }
    });

    ipcMain.on("delSay", (e, data) => {
      if (data) {
        this.server.delSay(data);
      }
    });

    ipcMain.on("baseChange", (e, data) => {
      this.server.changeBase(data);
    });

    ipcMain.on("enabledChange", (e, data) => {
      this.server.enabledChange(data);
      e.sender.send("sayRandomInit", this.server.sayRandom);
    });
  }

  createPreDialog(filepath) {
    if (this.preDialog) {
      this.preDialog.show();
      if (IS_LOCAL) {
        this.preDialog.loadURL(
          `${LOCAL_URL}/pre.html?filepath=${this.makeModelPath(filepath)}`
        );
      } else {
        this.preDialog.loadFile(path.join(__dirname, "../renderer/pre.html"), {
          search: "?filepath=" + this.makeModelPath(filepath),
        });
      }
      return;
    }
    const pre = new BrowserWindow({
      width: 800,
      height: 600,
      frame: true,
      resizable: false,
      icon: path.join(__dirname, "../favicon.ico"),
      webPreferences: {
        contextIsolation: false,
        webSecurity: false,
        devTools: DEV.pre,
        nodeIntegration: true,
        enablemotemodule: true,
        preload: path.join(__dirname, "./preload.js"),
      },
    });

    if (IS_LOCAL) {
      pre.loadURL(
        `${LOCAL_URL}/pre.html?filepath=${this.makeModelPath(filepath)}`
      );
    } else {
      pre.loadFile(path.join(__dirname, "../renderer/pre.html"), {
        search: "?filepath=" + this.makeModelPath(filepath),
      });
    }
    pre.on("closed", () => {
      this.preDialog = null;
    });
    if (DEV.pre) pre.webContents.openDevTools();
    this.preDialog = pre;
  }

  createSysDialog() {
    if (this.sysDialog) {
      this.sysDialog.show();
      return;
    }
    const sys = new BrowserWindow({
      width: 800,
      height: 600,
      frame: true,
      resizable: false,
      icon: path.join(__dirname, "../favicon.ico"),
      webPreferences: {
        contextIsolation: false,
        devTools: DEV.sys,
        nodeIntegration: true,
        enablemotemodule: true,
        preload: path.join(__dirname, "./preload.js"),
      },
    });
    sys.setMenu(null);

    if (IS_LOCAL) {
      sys.loadURL(`${LOCAL_URL}/sys.html`);
    } else {
      sys.loadFile(path.join(__dirname, "../renderer/sys.html"));
    }
    if (DEV.sys) sys.webContents.openDevTools();
    sys.on("closed", () => {
      this.sysDialog = null;
    });

    ipcMain.on("modelConfigInit", (e) => {
      e.sender.send("modelConfigInit", {
        modelConfig: this.server.modelConfig,
        sayConfig: {
          base: this.server.sayBase,
          random: this.server.sayRandom,
        },
      });
    });

    ipcMain.on("modelConfigChooseChange", (e, data) => {
      this.modelConfigToServer("choose", data);
    });

    ipcMain.on("modelConfigUseProxyChange", (e, data) => {
      this.modelConfigToServer("useProxy", data);
    });

    ipcMain.on("openChooseFileDialog", (e) => {
      const filepath = this.openChooseFileDialog(sys);
      e.sender.send("sysModelChooseFile", filepath);
    });

    this.sysDialog = sys;
  }

  openChooseFileDialog(win) {
    const temp = dialog.showOpenDialogSync(win, {
      properties: ["openFile"],
      filters: [{ name: "Custom File Type", extensions: ["json"] }],
    });
    if (temp && temp.length) {
      return temp[0];
    }
  }

  initAppHandler() {
    app.whenReady().then(() => {
      this.createWindow();
      const mainWindow = this.win;
      this.tray = new Tray(path.join(__dirname, "../favicon.ico"));
      let trayConfig = [
        {
          label: "置顶",
          type: "checkbox",
          checked: this.config.top,
          click: (item, win) => {
            var top = !mainWindow.isAlwaysOnTop();
            this.configToServer("top", top);
            return top;
          },
        },
        {
          label: "忽略鼠标点击",
          type: "checkbox",
          checked: this.config.noClick,
          click: (item, win) => {
            let c = !this.config.noClick;
            this.configToServer("noClick", c);
            return c;
          },
        },
        { type: "separator" },
        {
          label: "开机自启",
          type: "checkbox",
          checked: app.getLoginItemSettings().openAtLogin,
          click: (item) => {
            const { checked } = item;
            app.setLoginItemSettings({ openAtLogin: checked });
          },
        },
        {
          label: "设置",
          type: "normal",
          click: (item, win) => {
            this.createSysDialog();
          },
        },
        {
          label: "还原默认设置",
          type: "normal",
          click: (item, win) => {
            this.reset();
          },
        },
        { type: "separator" },
        {
          label: "退出",
          type: "normal",
          click: (item, win) => {
            app.quit();
          },
        },
      ];
      if (IS_LOCAL) {
        trayConfig = trayConfig.concat([
          {
            label: "还原ModelConfig",
            type: "normal",
            click: (item, win) => {
              this.server.store.delete("modelConfig");
            },
          },
          {
            label: "还原SayConfig",
            type: "normal",
            click: (item, win) => {
              this.server.store.delete("sayConfig");
            },
          },
          {
            label: "还原IsFirst",
            type: "normal",
            click: (item, win) => {
              this.server.store.delete("isFirst");
            },
          },
        ]);
      }
      const contextMenu = Menu.buildFromTemplate(trayConfig);

      this.tray.setToolTip("MPet");
      this.tray.setContextMenu(contextMenu);
      this.tray.on("click", () => {
        this.createSysDialog();
      });
      app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    app.on("window-all-closed", function () {
      if (process.platform !== "darwin") app.quit();
    });
  }

  handlePageInited(win, event) {
    if (!win) return;
    event.sender.send("init", {
      resize: win.isResizable(),
      modelJsonPath: this.makeModelPath(this.server.modelJsonPath),
    });
    Object.entries(this.config).forEach(([k, v]) => {
      this.configToPage(k, v);
    });
  }

  createWindow() {
    const mainWindow = new BrowserWindow({
      width: this.config.width,
      height: this.config.height,
      x: this.config.x,
      y: this.config.y,
      transparent: true,
      frame: false,
      resizable: false,
      alwaysOnTop: this.config.top,
      skipTaskbar: true,
      webPreferences: {
        contextIsolation: false,
        devTools: DEV.main,
        nodeIntegration: true,
        enablemotemodule: true,
        preload: path.join(__dirname, "./preload.js"),
      },
    });

    this.win = mainWindow;

    if (IS_LOCAL) {
      mainWindow.loadURL(`${LOCAL_URL}/home.html`);
    } else {
      mainWindow.loadFile(path.join(__dirname, "../renderer/home.html"));
    }

    if (DEV.main) mainWindow.webContents.openDevTools();

    this.initMainIpcHandler();

    mainWindow.on("resized", () => {
      const [width, height] = mainWindow.getSize();
      this.configToServer("width", width);
      this.configToServer("height", height);
    });

    mainWindow.on("moved", () => {
      const [x, y] = mainWindow.getPosition();
      this.configToServer("x", x);
      this.configToServer("y", y);
    });

    if (this.config.noClick) {
      this.win.setIgnoreMouseEvents(true, {
        forward: true,
      });
    } else {
      this.win.setIgnoreMouseEvents(false);
    }

    if (this.server.isFirst) {
      this.createSysDialog();
      this.server.noIsFirst();
    }
  }

  configSet(key, value) {
    if (key === "top") {
      this.win.setAlwaysOnTop(value);
    } else if (key === "noClick") {
      if (value) {
        this.win.setIgnoreMouseEvents(value, {
          forward: true,
        });
      } else {
        this.win.setIgnoreMouseEvents(value);
      }
    }
    this.config[key] = value;
    this.configToPage(key, value);
  }

  configToServer(k, v) {
    this.server.clientSetConfig(k, v);
  }

  configToPage(key, value) {
    this.win.webContents.send("configToPage", JSON.stringify({ key, value }));
  }

  sendToPage(type, info) {
    this.win.webContents.send(type, info);
  }

  modelConfigToServer(k, v) {
    const temp = this.server.clientSetModelConfig(k, v);
    if (k === "choose") {
      // 刷新页面
      this.win.webContents.reload();
    } else if (k === "useProxy") {
      // 判断是否要刷新
      const oldPath = this.makeModelPath(this.server.modelJsonPath, 1, !v);
      const newPath = this.makeModelPath(this.server.modelJsonPath, 1, v);
      if (oldPath !== newPath) this.win.webContents.reload();
      if (this.sysDialog) {
        this.sysDialog.webContents.send("modelUseProxyChange", v);
      }
    }
    return temp;
  }

  reset() {
    this.server.reset();
    setTimeout(() => {
      app.relaunch();
      app.exit();
    }, 1000);
  }

  makeModelPath(url, type = 0, val) {
    if (!type) {
      if (!url) return "";
      if (!this.server.modelConfig.useProxy) return url;
      if (
        !url.startsWith("http://raw.githubusercontent.com") &&
        !url.startsWith("https://raw.githubusercontent.com")
      )
        return url;
      return `https://ghproxy.com/${url}`;
    } else {
      if (!url) return "";
      if (!val) return url;
      if (
        !url.startsWith("http://raw.githubusercontent.com") &&
        !url.startsWith("https://raw.githubusercontent.com")
      )
        return url;
      return `https://ghproxy.com/${url}`;
    }
  }
}

const client = new Client();
