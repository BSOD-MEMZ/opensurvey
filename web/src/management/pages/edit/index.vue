<template>
  <div class="edit-index">
    <!-- 第一层：全局顶栏（问卷列表 / 下载中心 / 用户） -->
    <TopNav class="top" />

    <!-- 第二层：问卷内顶栏（返回 / 标题 / 五个板块 / 右侧操作） -->
    <SurveyNav class="survey" :beforeLeave="beforeLeave">
      <template #actions>
        <PreviewPanel />
        <HistoryPanel />
        <SavePanel
          ref="saveRef"
          :updateLogicConf="updateLogicConf"
          :updateWhiteConf="updateWhiteConf"
          :seize="seize"
        />
        <PublishPanel
          :updateLogicConf="updateLogicConf"
          :updateWhiteConf="updateWhiteConf"
          :seize="seize"
        />
      </template>
    </SurveyNav>

    <div class="content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditStore } from '@/management/stores/edit'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/src/message.scss'

import TopNav from '@/management/components/TopNav.vue'
import SurveyNav from '@/management/components/SurveyNav.vue'
import PreviewPanel from './modules/contentModule/PreviewPanel.vue'
import HistoryPanel from './modules/contentModule/HistoryPanel.vue'
import SavePanel from './modules/contentModule/SavePanel.vue'
import PublishPanel from './modules/contentModule/PublishPanel.vue'
import { seizeSession } from '@/management/api/survey'
import { applySkinVars } from '@/common/skinVars'

const editStore = useEditStore()
const { init, setSurveyId, schema, changeSchema } = editStore
const { showLogicEngine, jumpLogicEngine } = storeToRefs(editStore)

const router = useRouter()
const route = useRoute()

// 点「返回问卷列表」前先把最近的改动落盘，避免自动保存防抖窗口里丢数据
const saveRef = ref<any>(null)
const beforeLeave = async () => {
  await saveRef.value?.flush?.()
}

watch(
  () => schema.skinConf,
  (skinConfig) => {
    // 与答题端共用同一份逻辑：作者没设背景时，预演区那层半透明白也会一起让开，
    // 这样编辑器里看到的背景和真实答题页一致
    applySkinVars(skinConfig)
  },
  {
    deep: true,
    immediate: true
  }
)

/* ------------------------------------------------------------------
   以下三个「校验 / 夺权」函数原来放在 ModuleNavbar.vue 里。
   顶部栏合并后 ModuleNavbar 已删除，逻辑挪到这里，
   由 SavePanel / PublishPanel 通过 props 调用。
------------------------------------------------------------------ */

// 校验 - 逻辑
const updateLogicConf = () => {
  const { active } = route.query
  let res = {
    validated: true,
    message: ''
  }

  // 如果显示逻辑和跳转逻辑都设置了需要删除一个后才能保存成功
  if (
    (showLogicEngine.value?.rules?.length && active === 'jumpLogic') ||
    (jumpLogicEngine.value.rules?.length && active === 'showLogic')
  ) {
    return {
      validated: false,
      message:
        active === 'jumpLogic'
          ? '存在显示逻辑配置，删除后才能设置跳转逻辑'
          : '存在跳转逻辑配置，删除后才能设置显示逻辑'
    }
  }

  if (
    showLogicEngine.value &&
    showLogicEngine.value.rules &&
    showLogicEngine.value.rules.length !== 0
  ) {
    try {
      showLogicEngine.value.validateSchema()
    } catch (error) {
      // 把 yup 的具体原因带出来，便于定位是哪条规则有问题
      const reason = (error as any)?.errors?.[0] || (error as any)?.message || ''
      res = {
        validated: false,
        message: reason ? `逻辑配置有误：${reason}` : '逻辑配置不能为空'
      }

      return res
    }

    const showLogicConf = showLogicEngine.value.toJson()
    if (JSON.stringify(schema.logicConf.showLogicConf) !== JSON.stringify(showLogicConf)) {
      changeSchema({ key: 'logicConf', value: { showLogicConf } })
    }

    return res
  }
  const jumpLogicConf = jumpLogicEngine.value.toJson()
  if (JSON.stringify(schema.logicConf.jumpLogicConf) !== JSON.stringify(jumpLogicConf)) {
    changeSchema({ key: 'logicConf', value: { jumpLogicConf } })
  }

  return res
}

// 校验 - 白名单
const updateWhiteConf = () => {
  let res = {
    validated: true,
    message: ''
  }
  const baseConf = (schema?.baseConf as any) || {}
  if (baseConf.passwordSwitch && !baseConf.password) {
    res = {
      validated: false,
      message: '访问密码不能为空'
    }
    return res
  }
  if (baseConf.whitelistType != 'ALL' && !baseConf.whitelist?.length) {
    res = {
      validated: false,
      message: '白名单不能为空'
    }
    return res
  }
  return res
}

// 重新获取sessionid
const seize = async (sessionId: string) => {
  const seizeRes: Record<string, any> = await seizeSession({ sessionId })
  if (seizeRes.code === 200) {
    location.reload()
  } else {
    ElMessage.error('获取权限失败，请重试')
  }
}

onMounted(async () => {
  const surveyId = route.params.id as string
  setSurveyId(surveyId)

  try {
    await init()
  } catch (err: any) {
    ElMessage.error(err.message)

    setTimeout(() => {
      router.replace({ name: 'survey' })
    }, 1000)
  }
})
</script>
<style lang="scss" scoped>
.edit-index {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 整页透明，让 pjsk 渐变三角背景直接透上来 */
  background: transparent;

  .top,
  .survey {
    flex: none;
  }

  .content {
    flex: 1;
    min-height: 0;
    min-width: 1300px;
    overflow: hidden;
    background: transparent;
  }
}
</style>
