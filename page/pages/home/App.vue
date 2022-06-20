<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import Scene from "@components/Scene.vue";
</script>

<template>
  <Scene />
</template>

<style lang="less">
@font-face {
  font-family: "iconfont"; /* Project id  */
  src: url("@assets/icon/iconfont.ttf?t=1655735147130") format("truetype");
}

.iconfont {
  font-family: "iconfont" !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.icon-move-full:before {
  content: "\ea57";
}

.icon-suofang:before {
  content: "\e60c";
}

#app {
  position: relative;
  z-index: 2023;
}
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0);
}
* {
  box-sizing: border-box;
}
</style>
