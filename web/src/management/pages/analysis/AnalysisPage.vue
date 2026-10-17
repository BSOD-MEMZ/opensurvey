<template>
  <div class="analysis-page">
    <TopNav class="top" />
    <SurveyNav class="survey" />
    <div class="right">
      <div class="analysis-tabs">
        <router-link
          v-for="item in analysisType"
          class="analysis-tabs__item"
          :key="item.value"
          :to="{ name: item.value }"
        >
          <i class="iconfont" :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </router-link>
        <!-- 去掉 target="_blank"：同页打开后按返回就能回到统计，不再丢上下文 -->
        <router-link
          class="analysis-tabs__screen"
          :to="{ name: 'screenPage', params: { id: route.params.id } }"
        >
          <i-ep-monitor class="screen-icon" />
          <span>数据大屏</span>
        </router-link>
      </div>
      <div class="content-wrapper">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TopNav from '@/management/components/TopNav.vue'
import SurveyNav from '@/management/components/SurveyNav.vue'
import { analysisType } from '@/management/config/analysisConfig'
import { useEditStore } from '@/management/stores/edit'

const route = useRoute()
const editStore = useEditStore()

// 只登记 id，不触发 init()（统计页只读，不该去抢编辑 session）
onMounted(() => {
  if (route.params.id) {
    editStore.setSurveyId(String(route.params.id))
  }
})
</script>

<style lang="scss" scoped>
.analysis-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .top,
  .survey {
    flex: none;
  }

  .right {
    width: 100%;
    flex: 1;
    min-height: 0;
    min-width: 1300px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    /* 透明底 + 玻璃导航条，让 pjsk 渐变背景透上来 */
    background-color: transparent;

    .analysis-tabs {
      flex: none;
      gap: 40px;
      font-size: 14px;
      font-weight: normal;
      width: 100%;
      height: 56px;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 24px;
      background-color: rgba(255, 255, 255, 0.66);
      -webkit-backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(230, 233, 242, 0.9);

      &__item {
        cursor: pointer;
        padding: 8px 0;
        color: #92949d;

        .iconfont {
          margin-right: 8px;
        }
      }

      &__screen {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 16px;
        font-size: 13px;
        color: #2fa596;
        background: #eafcf9;
        border: 1px solid #b8ece4;
        transition: all 0.2s;

        .screen-icon {
          font-size: 15px;
        }

        &:hover {
          background: #d7f7f2;
          box-shadow: 0 0 0 3px #77eedd33;
        }
      }

      .router-link-active {
        color: $font-color-title;
        position: relative;
        height: 100%;
        display: flex;
        align-items: center;

        &::before {
          content: '';
          position: absolute;
          width: calc(100% + 5px);
          height: 3px;
          background-color: $primary-color;
          bottom: 0;
          left: 0;
        }
      }
    }
  }

  .content-wrapper {
    flex: auto;
    min-height: 0;
    overflow: hidden;
    padding: 24px;
  }
}
</style>
