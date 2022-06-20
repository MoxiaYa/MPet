const Store = require("electron-store");
const { app } = require("electron");
const { v4 } = require("uuid");
const _ = require("lodash");
const SayController = require("./say");
class App {
  constructor(client) {
    this.client = client;
    this.sayRandom = [];
    this.sayBase = 50;
    this.modelConfig = {};
    this.modelJsonPath = "";
    this.loadConfig();
    this.loadModelConfig();
    this.loadSayConfig();
    this.say = new SayController(
      this.client.say.bind(this.client),
      this.sayRandom,
      this.sayBase
    );
  }

  addSay(data) {
    const info = {
      id: v4(),
      type: data.type,
      value: data.text,
      param: data.param,
      time: data.time || 2,
      enabled: true,
      createTime: Date.now(),
    };
    this.sayRandom.push(info);
    this.store.set("sayConfig.random", this.sayRandom);
    return this.sayRandom;
  }

  delSay(v) {
    const idx = this.sayRandom.findIndex((i) => i.id === v);
    if (idx >= 0) {
      this.sayRandom.splice(idx, 1);
      this.store.set("sayConfig.random", this.sayRandom);
    }
  }

  enabledChange(data) {
    const info = this.sayRandom.find((i) => i.id === data.id);
    if (!info || info.enabled === data.val) return;
    info.enabled = data.val;
    this.store.set("sayConfig.random", this.sayRandom);
  }

  changeBase(base) {
    this.sayBase = base;
    this.say.base = base;
    this.store.set("sayConfig.base", base);
  }

  loadModelConfig() {
    let configStore = this.store.get("modelConfig");
    if (!configStore) {
      const defaultConfig = {
        models: [
          {
            id: "1",
            type: "default",
            name: "默认1[hk416_3401]",
            address: "./hk416_3401/hk416_3401.model.json",
            createTime: 1,
          },
          {
            id: "2",
            type: "default",
            name: "默认2[kp31_3101]",
            address: "./kp31_3101/kp31_3101.model.json",
            createTime: 2,
          },
        ],
        choose: "1",
        useProxy: true,
      };
      this.store.set("modelConfig", defaultConfig);
      configStore = defaultConfig;
    }
    this.modelConfig = _.cloneDeep(configStore);
    this.chooseModel(configStore.choose);
  }

  loadSayConfig() {
    let configStore = this.store.get("sayConfig");
    if (!configStore) {
      const defaultConfig = {
        random: [
          {
            id: "1",
            type: "time",
            value: "喂喂喂，现在已经{{time}}了哟~",
            enabled: true,
          },
          { id: "2", type: "text", value: "你饿了吗？", enabled: true },
          { id: "3", type: "text", value: "你好呀！！！", enabled: true },
          { id: "4", type: "text", value: "你在干嘛呢？", enabled: true },
          {
            id: "5",
            type: "timing",
            value: "该去吃饭啦...",
            enabled: true,
            param: "12:00",
          },
          {
            id: "5",
            type: "timing",
            value: "该去睡觉啦...",
            enabled: true,
            param: "21:20",
          },
        ],
        base: 50,
      };
      this.store.set("sayConfig", defaultConfig);
      configStore = defaultConfig;
    }
    this.sayBase = configStore.base;
    this.sayRandom = configStore.random;
  }

  loadConfig() {
    const store = new Store({
      name: "mpet_config", //文件名称,默认 config
      fileExtension: "json", //文件后缀,默认json
      cwd: app.getPath("userData"), //文件位置,尽量不要动，默认情况下，它将通过遵循系统约定来选择最佳位置。C:\Users\xxx\AppData\Roaming\test\config.json
      clearInvalidConfig: true, // 发生 SyntaxError  则清空配置,
    });

    let configStore = store.get("config");
    if (configStore) {
      this.setConfigProxy(configStore);
    } else {
      const defaultConfig = {
        top: true,
        noClick: false,
        useProxy: false,
        width: 200,
        height: 300,
        x: 100,
        y: 100,
      };
      store.set("config", defaultConfig);
      this.setConfigProxy(defaultConfig);
    }
    this.store = store;
    this.client.initConfig({ ...this.config });
  }

  setConfigProxy(config) {
    const temp = _.cloneDeep(config);
    this.config = new Proxy(temp, {
      set: this.configSet.bind(this),
    });
  }

  clientSetConfig(attr, value) {
    this.config[attr] = value;
  }

  clientSetModelConfig(k, v) {
    if (k === "choose") {
      this.chooseModel(v);
    } else if (k === "addModel") {
      const info = { ...v, id: v4(), createTime: Date.now() };
      this.modelConfig.models.push(info);
      this.saveModelConfig();
      return info;
    } else if (k === "delModel") {
      const idx = this.modelConfig.models.findIndex((i) => i.id === v);
      if (idx >= 0) {
        this.modelConfig.models.splice(idx, 1);
        this.saveModelConfig();
      }
    } else if (k === "useProxy") {
      this.modelConfig.useProxy = v;
      this.store.set("modelConfig.useProxy", v);
    }
  }

  chooseModel(choose) {
    if (!this.modelConfig || !this.modelConfig.models) return;
    const info = this.modelConfig.models.find((i) => i.id === choose);
    if (!info && info.address) {
      console.log("no info");
      return;
    }
    this.store.set("modelConfig.choose", choose);
    this.modelConfig.choose = choose;
    this.modelJsonPath = info.address;
  }

  saveModelConfig() {
    this.store.set("modelConfig.models", this.modelConfig.models);
  }

  configSet(target, attr, value) {
    target[attr] = value;
    this.client.configSet(attr, value);
    this.store.set(`config.${attr}`, value);
    return true;
  }

  reset() {
    this.store.delete("config");
  }
}

module.exports = App;
