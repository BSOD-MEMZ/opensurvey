<template>
  <div class="rule-wrapper">
    <el-form
      :hide-required-asterisk="true"
      class="form"
      ref="ruleForm"
      :inline="true"
      :model="ruleNode"
    >
      <ConditionView
        v-for="(conditionNode, index) in ruleNode.conditions"
        :key="conditionNode.id"
        :index="index"
        :ruleNode="ruleNode"
        :conditionNode="conditionNode"
        @delete="handleDeleteCondition"
      ></ConditionView>
      <div class="target-wrapper">
        <div class="line">
          <span class="desc">则显示</span>
          <el-form-item
            prop="target"
            :rules="[{ required: true, message: '请选择目标', trigger: 'change' }]"
          >
            <el-select
              class="select field-select"
              v-model="ruleTargets"
              multiple
              collapse-tags
              collapse-tags-tooltip
              :multiple-limit="20"
              placeholder="可选择多道题批量应用"
            >
              <el-option
                v-for="{ label, value, disabled } in targetQuestionList"
                :key="value"
                :label="label"
                :disabled="disabled && !ruleTargets.includes(value)"
                :value="value"
              >
              </el-option>
              <template #empty> 无数据 </template>
            </el-select>
          </el-form-item>
          <span v-if="ruleTargets.length > 1" class="group-tip">
            已批量应用到 {{ ruleTargets.length }} 道题
          </span>
        </div>
        <i-ep-delete style="font-size: 14px" @click="() => handleDelete(ruleNode.id)" />
      </div>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, shallowRef, watch, inject, type ComputedRef } from 'vue'
import { cloneDeep } from 'lodash-es'
import { ElMessageBox } from 'element-plus'
import 'element-plus/theme-chalk/src/message-box.scss'
import { RuleNode, ConditionNode } from '@/common/logicEngine/RuleBuild'
import { cleanRichText } from '@/common/xss'
import { useEditStore } from '@/management/stores/edit'
import { storeToRefs } from 'pinia'
const editStore = useEditStore()
const { showLogicEngine } = storeToRefs(editStore)
import ConditionView from './ConditionView.vue'

const renderData = inject<ComputedRef<Array<any>>>('renderData') || ref([])

const props = defineProps({
  ruleNode: {
    type: RuleNode,
    default: () => {}
  }
})
const emit = defineEmits(['delete'])

/**
 * 当前分组下的全部目标题（多选绑定）。
 *
 * 必须用「可写 computed」而不是只读 computed + @change：
 * el-select 的 v-model 会回写 modelValue，只读 computed 无法接收，
 * 会导致选中值与引擎状态不同步、把空串混进目标列表，
 * 进而让 yup 校验报「[0].target is a required field」。
 */
const ruleTargets = computed({
  get: () =>
    showLogicEngine.value
      .findTargetsByGroup(props.ruleNode.groupId)
      .filter((t: string) => typeof t === 'string' && t),
  set: (targets: string[]) => {
    const list = (targets || []).filter((t) => typeof t === 'string' && t)
    showLogicEngine.value.setGroupTargets(props.ruleNode.id, list)
  }
})

// 组的条件只在首条上编辑，改动后同步给同组其它规则，避免落到库里不一致
watch(
  () => JSON.stringify(props.ruleNode.conditions.map((c) => [c.field, c.operator, c.value])),
  () => {
    const group = showLogicEngine.value.rules.filter(
      (rule) => rule.groupId === props.ruleNode.groupId
    )
    if (group.length < 2) {
      return
    }
    group
      .filter((rule) => rule.id !== props.ruleNode.id)
      .forEach((rule) => {
        rule.conditions = props.ruleNode.conditions.map(
          (c) => new ConditionNode(c.field, c.operator, c.value)
        )
      })
  }
)

const handleDelete = async (id: any) => {
  await ElMessageBox.confirm('是否确认删除规则？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  emit('delete', id)
}
const handleDeleteCondition = (id: any) => {
  props.ruleNode.removeCondition(id)
}
const ruleForm = shallowRef<any>(null)
const submitForm = () => {
  ruleForm.value?.validate((valid: any) => {
    if (valid) {
      return true
    } else {
      return false
    }
  })
}
const targetQuestionList = computed(() => {
  const currntIndexs: number[] = []
  props.ruleNode.conditions.forEach((el) => {
    currntIndexs.push(
      renderData.value.findIndex((item: { field: string }) => item.field === el.field)
    )
  })
  const currntIndex = Math.max(...currntIndexs)
  let questionList = cloneDeep(renderData.value.slice(currntIndex + 1))
  return questionList.map((item: any) => {
    return {
      label: `${item.showIndex ? item.indexNumber + '.' : ''} ${cleanRichText(item.title)}`,
      value: item.field,
      disabled: showLogicEngine.value.findTargetsByScope('question').includes(item.field)
    }
  })
})
defineExpose({
  submitForm
})
</script>
<style lang="scss" scoped>
.rule-wrapper {
  width: 800px;
  padding: 10px 24px;
  border: 1px solid #e3e4e8;
  border-radius: 2px;
  display: flex;
  margin: 12px 0;
  box-sizing: border-box;
  .target-wrapper {
    padding: 24px 0;
    display: flex;
    align-items: center;
  }
  .desc {
    display: inline-block;
    margin-right: 12px;
    color: #333;
    line-height: 32px;
  }
  .el-form-item {
    display: inline-block;
    vertical-align: top !important;
    margin-bottom: 0px;
  }
}
.select {
  width: 320px;
}
.group-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #2fa596;
  background: #eafcf9;
  border: 1px solid #b8ece4;
  border-radius: 10px;
  padding: 2px 10px;
  line-height: 18px;
}
</style>
