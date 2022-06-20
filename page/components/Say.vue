<template>
  <div class="say-container">
    <div>
      <div>发言频率：</div>
      <el-slider v-model="sayConfig.base" @change="handleBaseChange" />
    </div>
    <div>
      <div>自定义发言：</div>
      <el-table
        v-if="props.sayConfig && props.sayConfig.random"
        :data="props.sayConfig.random"
        style="width: 100%"
        border
      >
        <el-table-column prop="type" label="类型" width="120">
          <template #default="scope">
            {{ sayType[scope.row.type] || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="value" label="文本" />
        <el-table-column prop="time" label="持续时间" width="100">
          <template #default="scope"> {{ scope.row.time || 2 }}秒 </template>
        </el-table-column>
        <el-table-column prop="param" label="其他参数" width="120">
          <template #default="scope">
            {{ scope.row.type === "timing" ? scope.row.param || "-" : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="scope">
            <el-link type="primary" v-if="scope.row.type === 'yiyan'"
              >修改</el-link
            >
            <el-link
              type="danger"
              v-else
              @click="delSay(scope.row.id, scope.$index)"
              >删除</el-link
            >
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="启用" width="80">
          <template #default="scope">
            <el-switch
              :model-value="scope.row.enabled"
              :before-change="
                handleEnabledChange.bind(null, scope.row.id, !scope.row.enabled)
              "
            ></el-switch>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else></el-empty>
    </div>
  </div>
</template>
<script setup>
import { reactive } from "vue";
const sayType = {
  time: "报时",
  text: "文本",
  timing: "定时提醒",
  yiyan: "一言API",
};
const props = defineProps({
  sayConfig: Object,
  handleBaseChange: Function,
  changeEnabled: Function,
  delSay: Function,
});
const handleEnabledChange = (id, enabled) => {
  props.changeEnabled(id, enabled);
  return false;
};
</script>

<style lang="less" scoped>
.say-container {
  padding: 0 10px 10px;
}
</style>
