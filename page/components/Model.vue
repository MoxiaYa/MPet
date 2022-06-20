<template>
  <div class="model-container">
    <el-divider style="margin-top: 10px">模型列表</el-divider>
    <el-radio-group
      v-model="choose"
      v-if="modelConfig && modelConfig.models"
      @change="handleChooseChange"
    >
      <el-table :data="modelConfig.models" style="width: 100%">
        <el-table-column label="选择" width="100">
          <template #default="scope">
            <el-radio class="my-radio" :label="scope.row.id"></el-radio>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="scope">
            {{ scope.row.type === "default" ? "默认" : "自定义" }}
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="address" label="地址">
          <template #default="scope">
            {{ scope.row.type === "default" ? "-" : scope.row.address }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <template v-if="scope.row.type !== 'default'">
              <el-button
                type="text"
                style="color: red"
                @click="delModel(scope.row.id, scope.$index)"
                >删除</el-button
              >
            </template>
            <el-button type="text" @click="openPre(scope.row.address)"
              >预览</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-radio-group>
    <el-empty v-else></el-empty>
    <el-divider>其他设置</el-divider>
    <div>
      <div>
        <span>使用ghProxy代理：</span>
        <el-switch
          v-model="useProxy"
          @change="handleUseProxyChange"
        ></el-switch>
        <el-link
          type="primary"
          style="margin-left: 10px"
          @click="open('https://ghproxy.com/')"
          >什么是ghProxy？</el-link
        >
      </div>
      <div>
        <span>代理规则：</span>
        <span>模型链接为http(s)://raw.githubusercontent.com开头；</span>
      </div>
    </div>
  </div>
</template>
<script setup>
const { shell } = require("electron");
import { reactive, ref, watch } from "vue";
const choose = ref("1");
const props = defineProps({
  modelConfig: Object,
  delModel: Function,
});

const useProxy = ref(true);

const open = (url) => {
  shell.openExternal(url);
};

watch(
  () => props.modelConfig.choose,
  (val) => {
    choose.value = val;
  },
  {
    immediate: true,
    deep: true,
  }
);

watch(
  () => props.modelConfig.useProxy,
  (val) => {
    useProxy.value = val;
  },
  {
    immediate: true,
    deep: true,
  }
);

const openPre = (address) => {
  if (!address) {
    alert("请先选择/输入模型的model.json路径");
    return;
  }
  if (window.ElectronIpcRenderer) {
    window.ElectronIpcRenderer.send("openPre", address.replaceAll("\\", "/"));
  } else {
    alert("未连接");
  }
};

const handleChooseChange = (e) => {
  if (window.ElectronIpcRenderer) {
    window.ElectronIpcRenderer.send("modelConfigChooseChange", e);
  }
};

const handleUseProxyChange = (e) => {
  if (window.ElectronIpcRenderer) {
    window.ElectronIpcRenderer.send("modelConfigUseProxyChange", e);
  }
};
</script>

<style lang="less">
.model-container {
  .actions {
    text-align: right;
    padding: 0 10px;
  }
  .el-radio-group {
    display: flex;
    .my-radio .el-radio__label {
      display: none;
    }
  }
}
</style>
