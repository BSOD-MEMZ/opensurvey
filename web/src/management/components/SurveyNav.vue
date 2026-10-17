<template>
  <!--
    问卷内顶栏：编辑器 / 投放 / 统计 三个页面共用。
    原来这些入口散落在「左侧竖排图标栏(LeftMenu)」和「编辑器顶部栏(ModuleNavbar)」两处，
    现在合并成一条横向顶栏，页面里只剩「全局顶栏 + 这条」两层。
  -->
  <div class="survey-nav">
    <div class="survey-nav__left">
      <SekaiBackButton size="sm" plain title="返回问卷列表" @click="onBack" />
      <span v-if="title" class="survey-nav__title" :title="title">{{ title }}</span>
    </div>

    <nav class="survey-nav__tabs">
      <a
        v-for="tab in tabs"
        :key="tab.text"
        class="survey-nav__tab"
        :class="{ 'is-active': isActiveTab(tab) }"
        :href="tabHref(tab)"
        @click.prevent="goTab(tab)"
      >
        {{ tab.text }}
      </a>
    </nav>

    <div class="survey-nav__actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SekaiBackButton from '@/management/components/SekaiBackButton.vue'
import { useEditStore } from '@/management/stores/edit'

const route = useRoute()
const router = useRouter()
const editStore = useEditStore()

/**
 * 离开前钩子：编辑器会传一个「先把改动存一次」的函数进来，
 * 这样从点「返回」到跳转之间不会丢掉自动保存防抖窗口里的修改。
 */
const props = defineProps<{
  beforeLeave?: () => void | Promise<void>
}>()

const surveyId = computed(() => String(route.params.id || ''))
const currentName = computed(() => String(route.name || ''))

interface Tab {
  text: string
  name: string
  /** 这些路由名都算落在这个 tab 上（子路由 active 判断用） */
  scope: string[]
}

// 五个板块平铺。注意「问卷编辑/问卷设置/皮肤设置」原来在编辑器顶部栏，
// 「投放问卷/数据统计」原来在左侧竖排栏 —— 现在同层。
const tabs: Tab[] = [
  {
    text: '问卷编辑',
    name: 'QuestionEditIndex',
    scope: ['QuestionEdit', 'QuestionEditPage', 'QuestionEditIndex', 'LogicIndex']
  },
  { text: '问卷设置', name: 'QuestionEditSetting', scope: ['QuestionEditSetting'] },
  {
    text: '皮肤设置',
    name: 'QuestionSkinSetting',
    scope: ['QuestionSkinSetting', 'QuestionEditResultConfig']
  },
  { text: '投放问卷', name: 'channel', scope: ['channel'] },
  {
    text: '数据统计',
    name: 'analysisPage',
    scope: ['analysisPage', 'dataTable', 'separateStatistics', 'responseManage', 'screenPage']
  }
]

const isActiveTab = (tab: Tab) => tab.scope.includes(currentName.value)

// 这里刻意用 push 而不是 replace：切 tab 后按浏览器后退应能回到上一个 tab，
// 而不是直接被踢出问卷（原来 LeftMenu 用 replace 就会这样）。
const goTab = (tab: Tab) => {
  if (isActiveTab(tab)) return
  router.push({ name: tab.name, params: { id: surveyId.value } })
}

const tabHref = (tab: Tab) =>
  router.resolve({ name: tab.name, params: { id: surveyId.value } }).href

const goList = () => router.push({ name: 'survey' })

const onBack = async () => {
  try {
    await props.beforeLeave?.()
  } catch (e) {
    /* 存不下去也要让人能走，别把人锁在编辑器里 */
  }
  goList()
}

// 只有 store 里装的确实是「当前这份问卷」时才显示标题，避免串到上一份问卷的名字
const title = computed(() => {
  const meta: any = (editStore.schema as any)?.metaData
  if (!meta || String(meta._id || '') !== surveyId.value) return ''
  return String(meta.title || '')
})
</script>

<style lang="scss" scoped>
.survey-nav {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  height: 56px;
  padding: 0 20px;
  /* 与 LeftMenu 同一套玻璃质感，别在渐变背景上压一整块死白 */
  background: rgba(255, 255, 255, 0.72);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(230, 233, 242, 0.9);
  z-index: 50;

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 0 1 340px;
  }

  &__title {
    font-size: 14px;
    font-weight: 500;
    color: #444466;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__tabs {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
  }

  &__tab {
    padding: 6px 16px;
    font-size: 14px;
    line-height: 1.4;
    color: #5d5d80;
    border-radius: 999px;
    cursor: pointer;
    white-space: nowrap;
    transition: color 0.16s ease, background-color 0.16s ease;

    &:hover {
      color: #2fa596;
      background: rgba(119, 238, 221, 0.16);
    }

    &.is-active {
      color: #1f8a7d;
      font-weight: 700;
      background: rgba(119, 238, 221, 0.26);
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 0 0 auto;
  }
}
</style>
