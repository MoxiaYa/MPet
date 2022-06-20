<template>
  <div class="sys-container">
    <div class="toolbar">
      <div class="left">
        <div class="title"><span>配置</span></div>
      </div>
      <div class="right">
        <el-button type="danger" size="small" @click="refresh">刷新</el-button>
      </div>
    </div>
    <div class="main">
      <el-collapse v-model="collapse" accordion>
        <el-collapse-item title="言语设置" name="2">
          <template #title>
            <span>言语设置</span>
            <el-button
              v-show="collapse === '2'"
              type="primary"
              size="small"
              style="margin-left: 20px"
              @click.prevent.stop="handleAddSay"
              >添加</el-button
            >
          </template>
          <Say
            :sayConfig="sayConfig"
            :handleBaseChange="handleBaseChange"
            :changeEnabled="changeEnabled"
            :delSay="delSay"
          />
        </el-collapse-item>
        <el-collapse-item title="模型设置" name="3">
          <template #title>
            <span>模型设置</span>
            <el-button
              v-show="collapse === '3'"
              type="primary"
              size="small"
              style="margin-left: 20px"
              @click.prevent.stop="handleAddModel"
              >添加</el-button
            >
          </template>
          <Model
            ref="modelRef"
            :modelConfig="modelConfig"
            :delModel="delModel"
          />
        </el-collapse-item>
        <el-collapse-item title="关于软件" name="4">
          <div>MPet - 当前版本：v1.0.0.beta</div>
          <div>
            灵感来源：PPet（感兴趣的可以自行github），因为觉得好玩，所以自己写了一个。
          </div>
          <div>如果使用过程遇到问题可以联系QQ：1742183536。</div>
          <div>版本发布：https://gitee.com/MoXiaYA/mpet-public</div>
          <div>注意：该软件暂不支持live2d v3 !!!</div>
          <div>--by zhangmo</div>
          <div><img :src="img" class="about-img" /></div>
        </el-collapse-item>
      </el-collapse>
    </div>
    <el-drawer
      ref="drawerRef"
      v-model="modelDialog"
      :title="drawerTitle"
      :before-close="handleModelDialogClose"
      custom-class="model-add-drawer"
      size="50%"
    >
      <div class="model-add-drawer__content">
        <el-form :model="modelForm" label-position="top">
          <el-form-item :label="drawerTitle === '添加模型' ? '名称' : '文本'">
            <el-input v-model="modelForm.name" autocomplete="off" />
          </el-form-item>
          <el-form-item label="类型">
            <el-radio-group
              v-model="modelForm.type"
              @change="modelForm.address = ''"
            >
              <el-radio label="local" size="large">{{
                drawerTitle === "添加模型" ? "本地" : "文本"
              }}</el-radio>
              <el-radio label="net" size="large">{{
                drawerTitle === "添加模型" ? "网络" : "时间"
              }}</el-radio>
              <el-radio
                label="timing"
                size="large"
                v-if="drawerTitle !== '添加模型'"
                >定时提醒</el-radio
              >
            </el-radio-group>
            <div v-if="drawerTitle !== '添加模型' && modelForm.type === 'net'">
              {{ "tip: 时间类型可用{\{time}\}表示当前时间。" }}
            </div>
          </el-form-item>
          <el-form-item
            label="选择model.json文件"
            v-if="drawerTitle === '添加模型'"
          >
            <div v-if="modelForm.type === 'local'">
              <el-button type="primary" size="small" @click="startUpload"
                >点击选择</el-button
              >
              <span class="upload-tip">文件名通常为：模型名.model.json</span>
              <div>{{ modelForm.address }}</div>
            </div>
            <template v-else>
              <el-input v-model="modelForm.address" autocomplete="off" />
            </template>
          </el-form-item>
          <el-form-item
            label="提醒时间（每日）"
            v-if="
              drawerTitle === '添加自定义言语' && modelForm.type === 'timing'
            "
          >
            <el-time-picker
              v-model="modelForm.param"
              format="HH:mm"
              placeholder="选择提醒时间"
            />
          </el-form-item>
          <el-form-item
            label="持续时间"
            v-if="drawerTitle === '添加自定义言语'"
          >
            <el-input-number v-model="modelForm.time" :min="1" :max="30" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button type="danger" @click="handleModelDialogClose"
          >取消</el-button
        >
        <el-button
          :disabled="!modelForm.address"
          @click="openPre"
          v-if="drawerTitle === '添加模型'"
          >预览</el-button
        >
        <el-button
          type="primary"
          :loading="modelLoading"
          @click="handleModelOkForm"
          >{{ modelLoading ? "导入中" : "确认" }}</el-button
        >
      </template>
    </el-drawer>
  </div>
</template>
<script setup>
import { onMounted, reactive, ref, getCurrentInstance } from "vue";
import { ElMessage } from "element-plus";
import moment from "moment";
import Say from "./Say.vue";
import Model from "./Model.vue";
import img from "@assets/demo.png";

const { appContext } = getCurrentInstance();
const collapse = ref("4");
const modelRef = ref(null);
const modelConfig = reactive({ choose: "", models: [], useProxy: true });
const sayConfig = reactive({ base: 50, random: [] });
const drawerTitle = ref("添加模型");
const modelDialog = ref(false);
const modelForm = reactive({
  name: "",
  address: "",
  param: "",
  time: 2,
  type: "local", // local本地 net网络
});

const modelLoading = ref(false);

const handleAddModel = () => {
  drawerTitle.value = "添加模型";
  modelDialog.value = true;
};

const handleAddSay = () => {
  drawerTitle.value = "添加自定义言语";
  modelDialog.value = true;
};

const handleModelDialogClose = () => {
  modelDialog.value = false;
  modelForm.name = "";
  modelForm.address = "";
  modelForm.type = "local";
  modelForm.param = "";
  window.ElectronIpcRenderer.send("closePre");
};

const changeEnabled = (id, val) => {
  window.ElectronIpcRenderer.send("enabledChange", {
    id,
    val,
  });
};

const handleBaseChange = (val) => {
  window.ElectronIpcRenderer.send("baseChange", val);
};

const handleAddModelOk = () => {
  if (!modelForm.name) {
    alert("请填写模型名称");
    return;
  }

  if (!modelForm.address) {
    alert("请选择或输入模型地址");
    return;
  }

  const info = {
    name: modelForm.name,
    address: modelForm.address.replaceAll("\\", "/"),
  };

  if (window.ElectronIpcRenderer) {
    modelLoading.value = true;
    window.ElectronIpcRenderer.send("addModel", info);
  } else {
    alert("未连接");
  }
};

const handleAddSayOk = () => {
  if (!modelForm.name) {
    alert("请填写言语文本");
    return;
  }

  if (modelForm.type === "timing" && !modelForm.param) {
    alert("请选择提醒时间");
    return;
  }

  const type = {
    local: "text",
    net: "time",
    timing: "timing",
  }[modelForm.type];

  const info = {
    text: modelForm.name,
    type,
    time: modelForm.time,
    param:
      modelForm.type === "timing"
        ? moment(modelForm.param).format("HH:mm")
        : "",
  };

  console.log("add", info);

  if (window.ElectronIpcRenderer) {
    modelLoading.value = true;
    window.ElectronIpcRenderer.send("addSay", info);
  } else {
    alert("未连接");
  }
};

const handleModelOkForm = () => {
  if (drawerTitle.value === "添加模型") {
    handleAddModelOk();
  } else {
    handleAddSayOk();
  }
};
const refresh = () => {
  location.reload();
};

const startUpload = () => {
  if (window.ElectronIpcRenderer) {
    window.ElectronIpcRenderer.send("openChooseFileDialog");
  } else {
    alert("未连接");
  }
};

const openPre = () => {
  if (!modelForm.address) {
    alert("请先选择/输入模型的model.json路径");
    return;
  }
  modelForm.address = modelForm.address.replaceAll("\\", "/");
  if (window.ElectronIpcRenderer) {
    window.ElectronIpcRenderer.send("openPre", modelForm.address);
  } else {
    alert("未连接");
  }
};

const delModel = (id, idx) => {
  const sure = confirm("确认删除吗？");
  if (!sure) return;
  if (window.ElectronIpcRenderer) {
    window.ElectronIpcRenderer.send("delModel", id);
    modelConfig.models.splice(idx, 1);
    ElMessage(
      { message: "删除成功", type: "success", duration: 1500 },
      appContext
    );
  } else {
    alert("未连接");
  }
};

const delSay = (id, idx) => {
  const sure = confirm("确认删除吗？");
  if (!sure) return;
  if (window.ElectronIpcRenderer) {
    window.ElectronIpcRenderer.send("delSay", id);
    sayConfig.random.splice(idx, 1);
    ElMessage(
      { message: "删除成功", type: "success", duration: 1500 },
      appContext
    );
  } else {
    alert("未连接");
  }
};

onMounted(() => {
  setTimeout(() => {
    if (window.ElectronIpcRenderer) {
      window.ElectronIpcRenderer.send("modelConfigInit");
      window.ElectronIpcRenderer.on("modelConfigInit", (e, data) => {
        modelConfig.choose = data.modelConfig.choose;
        modelConfig.models = data.modelConfig.models;
        modelConfig.useProxy = data.modelConfig.useProxy;
        sayConfig.base = data.sayConfig.base;
        sayConfig.random = data.sayConfig.random;
      });
      window.ElectronIpcRenderer.on("modelUseProxyChange", (e, data) => {
        modelConfig.useProxy = data;
      });
      window.ElectronIpcRenderer.on("sysModelChooseFile", (e, data) => {
        if (data && modelDialog.value) {
          modelForm.address = data;
        }
      });
      window.ElectronIpcRenderer.on("sayRandomInit", (e, data) => {
        sayConfig.random = data;
      });
      window.ElectronIpcRenderer.on("addModel", (e, data) => {
        modelLoading.value = false;
        if (data) {
          modelConfig.models.push(data);
          handleModelDialogClose();
          ElMessage(
            { message: "添加成功", type: "success", duration: 1500 },
            appContext
          );
        } else {
          alert("未知异常，添加失败");
        }
      });

      window.ElectronIpcRenderer.on("addSay", (e, data) => {
        modelLoading.value = false;
        if (data) {
          sayConfig.random = data;
          handleModelDialogClose();
          ElMessage(
            { message: "添加成功", type: "success", duration: 1500 },
            appContext
          );
        } else {
          alert("未知异常，添加失败");
        }
      });
    }
  }, 500);
});
</script>

<style lang="less" scoped>
.sys-container {
  background-color: rgb(245, 245, 245);
  width: 100%;
  height: 100%;
  /deep/ .el-drawer__header {
    margin-bottom: 0;
  }
  .toolbar {
    height: 30px;
    width: 100%;
    background-color: #fff;
    display: flex;
    border-bottom: 1px solid rgb(185, 185, 185);
    .left {
      display: flex;
      align-items: center;
      padding-left: 5px;
      .title {
        letter-spacing: 4px;
        font-weight: 600;
      }
    }
    .right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 5px;
    }
  }
  .main {
    height: calc(100% - 30px);
    padding: 10px 0 10px 16px;
    width: 100%;
    overflow-x: hidden;
    overflow-y: scroll;
    /deep/ .el-collapse-item {
      padding-left: 5px;
      background-color: #fff;
    }
    .about-img {
      width: 100px;
      margin-top: 10px;
    }
  }
}
</style>
