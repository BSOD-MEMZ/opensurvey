<template>
  <SekaiBackground />
  <router-view></router-view>
</template>
<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia'

import SekaiBackground from '@/common/SekaiBackground/index.vue'
import { injectCustomCss } from '@/common/safeCss'
import { applySkinVars } from '@/common/skinVars'
import { useSurveyStore } from './stores/survey'

const { skinConf } = storeToRefs(useSurveyStore())

watch(skinConf, (skinConfig) => {
  const { customCssConf }: any = skinConfig || {}

  // 主题色 / 背景 / 蒙层透明度统一在 skinVars 里处理
  // （作者没设背景时会把那层半透明白蒙层关掉，露出 pjsk 渐变背景）
  applySkinVars(skinConfig)

  // 问卷作者自定义的 CSS —— 渲染时过滤掉会向第三方发请求的写法（@import / 外链 url）
  injectCustomCss(customCssConf?.code)
}, { immediate: true })
</script>
<style lang="scss">
@import url('./styles/icon.scss');
@import url('../materials/questions/common/css/icon.scss');
@import url('./styles/reset.scss');
@import './styles/sekai.scss';

html {
  /* 兜底色：万一背景组件被禁用，也不至于纯白一片 */
  background: #f7f7f7;
}

#app {
  position: relative;
  overflow-x: hidden;
  width: 100%;
  max-width: 750px;
  margin: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  /* 透明：让 pjsk 渐变背景透上来（原本是不透明白底，会把背景整个挡死） */
  background-color: transparent;
}

@media screen and (min-width: 750px) {
  body {
    padding-top: 40px;
    /* 问卷作者设置了背景色/图时会盖住默认的 pjsk 背景 —— 尊重作者设置 */
    background: var(--primary-background);
  }
  #app {
    border-radius: 8px 8px 0 0;
  }
}
</style>
