<template>
  <div>
    <div>预览 - {{ filepath }}</div>
  </div>
</template>

<script setup>
import { L2Dwidget } from "live2d-widget";
import { debounce } from "lodash";
import { ref, onMounted } from "vue";
const filepath = ref("");

let width = 0;
let height = 0;

const initParam = () => {
  let search = location.search;
  if (!search) return;
  search = search.split("?");
  if (!search || !search.length || search.length <= 1) return;
  search = search[1];
  search = search.split("=");
  if (!search || !search.length || search.length <= 1) return;
  // if (search[1].startsWith("https://raw.githubusercontent.com/")) {
  //   const proxy = "https://ghproxy.com/";
  //   filepath.value = proxy + search[1];
  //   return;
  // }
  filepath.value = search[1];
};
initParam();

const handleResize = debounce(() => {
  location.reload();
}, 1000);

const init = () => {
  if (!filepath.value) return;
  L2Dwidget.init({
    display: {
      width: width * 0.5,
      height,
    },
    model: {
      jsonPath: filepath.value,
    },
  });
};

onMounted(() => {
  width = document.documentElement.clientWidth;
  height = document.documentElement.clientHeight;
  window.onresize = handleResize;
  init();
});
</script>

<style></style>
