<template>
  <div :class="{ marker: true, resize: config.resize }">
    <div class="message" v-show="message.show">{{ message.text }}</div>
    <div class="toolbar" v-show="!config.noClick">
      <button
        :class="{ 'tb-btn': true, resize: config.resize }"
        @click="handleConfigChange('resize')"
      >
        <i class="iconfont icon-move-full"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { L2Dwidget } from "live2d-widget";
import { onMounted, ref, reactive, watch } from "vue";
import { debounce } from "lodash";
import moment from "moment";

const jsonPath = ref("");

const config = reactive({
  resize: false,
  top: true,
  noClick: false,
});

const message = reactive({
  text: "",
  show: false,
  timer: null,
});

let width = 0;
let height = 0;
const handleConfigChange = (type) => {
  config[type] = !config[type];
  if (window.ElectronIpcRenderer) {
    window.ElectronIpcRenderer.send("changeConfig", {
      resize: config.resize,
    });
  }
};

const handleResize = debounce(() => {
  location.reload();
}, 1000);

const init = () => {
  if (!jsonPath.value) return;
  L2Dwidget.init({
    display: {
      width: width * 0.8,
      height,
    },
    model: {
      jsonPath: jsonPath.value,
    },
  });
};

watch(
  () => jsonPath.value,
  (val, old) => {
    if (val !== old) {
      init();
    }
  },
  {}
);

onMounted(() => {
  width = document.documentElement.clientWidth;
  height = document.documentElement.clientHeight;
  window.onresize = handleResize;

  setTimeout(() => {
    if (window.ElectronIpcRenderer) {
      window.ElectronIpcRenderer.send("init");
      window.ElectronIpcRenderer.on("init", (e, data) => {
        if (data) {
          config.resize = data.resize;
          jsonPath.value = data.modelJsonPath;
        }
      });

      window.ElectronIpcRenderer.on("configToPage", (e, data) => {
        data = JSON.parse(data);
        config[data.key] = data.value;
      });

      window.ElectronIpcRenderer.on("showMessage", (e, data) => {
        if (message.timer) clearTimeout(message.timer);
        if (data.type === "time") {
          if (data.value) {
            message.text = data.value.replace(
              /{{time}}/g,
              moment().format("HH:mm")
            );
          } else {
            message.text = `喂喂喂，现在已经${moment().format("HH:mm")}了哟~`;
          }
        } else {
          message.text = data.value;
        }
        message.show = true;
        message.timer = setTimeout(() => {
          message.show = false;
        }, data.time || 2500);
      });
    }
  }, 500);
});
</script>

<style lang="less">
#live2d-widget {
  width: 80% !important;
  height: 100% !important;
  position: fixed !important;
  z-index: 2022 !important;
  left: 10%;
  top: 0;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0);
  #live2dcanvas {
    width: 100% !important;
    height: 100% !important;
  }
}
.marker {
  position: fixed;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  .message {
    background-color: rgba(164, 214, 255, 0.7);
    position: absolute;
    border: 1px solid #59a0dd;
    box-shadow: 0px 0px 10px #99b9e9;
    padding: 10px;
    border-radius: 5px;
    top: 5px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2022;
    font-size: 12px;
    white-space: pre;
    max-width: 80%;
    user-select: none;
    pointer-events: none;
    word-break: break-all;
    word-wrap: break-word;
    white-space: normal;
    overflow: hidden;
  }
  &.resize {
    border: 3px dotted black;
    -webkit-app-region: drag;
    cursor: move;
    .toolbar {
      opacity: 1;
      button.resize {
        -webkit-app-region: no-drag;
      }
    }
  }
  .toolbar {
    position: absolute;
    right: 10px;
    top: 50%;
    opacity: 0;
    width: 40px;
    height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2022;
    transform: translateY(-50%);
    &:hover {
      opacity: 1;
    }
    button.tb-btn {
      background-color: rgb(69, 142, 252);
      color: #fff;
      padding: 5px;
      border: none;
      border-radius: 5px;
      margin: 5px 0;
      cursor: pointer;
      &.resize {
        background-color: red;
      }
      &.top.active {
        background-color: green;
      }
    }
    .drag {
      -webkit-app-region: drag;
      cursor: move;
    }
  }
}
</style>
