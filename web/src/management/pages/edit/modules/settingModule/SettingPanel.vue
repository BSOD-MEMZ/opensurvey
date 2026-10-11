<template>
  <div class="question-config">
    <div class="question-config-wrapper">
      <div class="question-config-main">
        <div v-for="form of formConfigList" :key="form.key" class="config-item">
          <div class="config-title">
            <span>
              {{ form.title }}
            </span>
          </div>
          <SetterField
            :key="form.key"
            class="question-config-form"
            label-position="left"
            label-width="200px"
            :form-config-list="form.formList"
            :module-config="baseConf"
            :custom-components="{
              WhiteList,
              ExamScorePanel
            }"
            @form-change="handleFormChange"
          ></SetterField>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useEditStore } from '@/management/stores/edit'

import baseConfig from '@/management/pages/edit/setterConfig/baseConfig'
import baseFormConfig from '@/management/pages/edit/setterConfig/baseFormConfig'
import SetterField from '@/management/pages/edit/components/SetterField.vue'

import WhiteList from './components/WhiteList.vue'
import ExamScorePanel from './components/ExamScorePanel.vue'

const editStore = useEditStore()
const { schema, changeSchema } = editStore
const baseConf = toRef(schema, 'baseConf')

const baseConfigWithFormList = baseConfig.map((item) => ({
  ...item,
  formList: item.formList.map((key) => (baseFormConfig as any)[key]).filter((config) => !!config)
}))
const formConfigList = ref<Array<any>>(baseConfigWithFormList)

const handleFormChange = ({ key, value }: any) => {
  changeSchema({
    key: `baseConf.${key}`,
    value: value
  })
}
</script>

<style lang="scss" scoped>
.question-config {
  width: 100%;
  min-width: 1080px;
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 50px 100px;

  .question-config-wrapper {
    position: relative;
    width: 50%;
    min-width: 785px;
    height: 100%;
    overflow-y: auto;

    .question-config-main {
      .config-item {
        position: relative;
        margin-bottom: 18px;
        padding: 22px 28px;
        /* 玻璃卡片：不再是一整块死白，背景能透上来 */
        background: var(--sk-glass, rgba(255, 255, 255, 0.72));
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.6);
        border-radius: var(--sk-r-lg, 18px);
        box-shadow: 0 8px 26px rgba(68, 68, 102, 0.1);

        .config-title {
          font-size: 17px;
          color: var(--sk-ink, #444466);
          text-align: left;
          padding-bottom: 16px;
          margin-bottom: 10px;
          border-bottom: 1px dashed var(--sk-line, #e6e9f2);

          span {
            position: relative;

            &:after {
              position: absolute;
              left: 0;
              top: 34px;
              width: 100%;
              height: 3px;
              border-radius: 999px;
              background-color: var(--sk-teal, #77eedd);
              content: '';
            }
          }
        }

        .question-config-form {
          padding-left: 30px;
          padding-top: 15px;
          padding-right: 1rem;

          :deep(.star-form.star-form_horizon .star-form-label) {
            display: inline-block;
            width: 3.4rem;
            text-align: left;
            padding-right: 15px;
          }
        }
      }
    }
  }
}
</style>
