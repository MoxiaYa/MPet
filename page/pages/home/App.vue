<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import Scene from "@components/Scene.vue";
</script>

<template>
  <Scene />
</template>

<style lang="less">
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
