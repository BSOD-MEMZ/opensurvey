<template>
  <div class="result-page-wrap">
    <div class="result-page">
      <div class="result-content">
        <img src="/imgs/icons/success.webp" />
        <!-- 考试模式：展示本次得分（服务端判分，刷新即失效） -->
        <div v-if="examResult" class="exam-card">
          <div class="exam-card__label">本次得分</div>
          <div class="exam-card__score">
            <span class="num">{{ examResult.score }}</span>
            <span class="full">/ {{ examResult.fullScore }}</span>
          </div>
          <div class="exam-card__meta">
            答对 {{ examResult.correctCount }} / {{ examResult.gradedCount }} 题
            · 正确率 {{ examResult.accuracy }}%
          </div>
          <div v-if="passLine > 0" class="exam-card__pass" :class="{ 'is-pass': isPass }">
            {{ isPass ? '已及格' : '未及格' }}
          </div>
        </div>
        <div class="msg" v-html="successMsg"></div>
        <router-link
          :to="{
            name: 'renderPage',
            query: {
              t: new Date().getTime()
            }
          }"
          replace
          class="reset-link"
        >
          重新填写
        </router-link>
      </div>
      <LogoIcon :logo-conf="logoConf" :readonly="true" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useSurveyStore } from '../stores/survey'
// @ts-ignore
import communalLoader from '@materials/communals/communalLoader.js'

const LogoIcon = communalLoader.loadComponent('LogoIcon')
const surveyStore = useSurveyStore()

const logoConf = computed(() => {
  return surveyStore?.bottomConf || {}
})
const successMsg = computed(() => {
  const msgContent = (surveyStore?.submitConf as any)?.msgContent || {}
  return msgContent?.msg_200 || '提交成功'
})

// 考试模式：得分与及格线
const examResult = computed(() => (surveyStore as any)?.examResult || null)
const passLine = computed(
  () => Number((surveyStore as any)?.baseConf?.examPassScore) || 0
)
const isPass = computed(
  () => Boolean(examResult.value) && examResult.value.score >= passLine.value
)
</script>
<style lang="scss" scoped>
@import '@/render/styles/variable.scss';

.result-page-wrap {
  width: 100%;
  flex: 1;
  text-align: center;
  overflow: hidden;
  background: var(--primary-background-color);

  padding: 0 0.3rem;
  .result-page {
    background: rgba(255, 255, 255, var(--opacity));
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}

.result-content {
  position: relative;
  max-width: 920px;
  margin: 0 auto;
  height: 100%;
  width: 100%;
  position: relative;
  padding-top: 2rem;
  flex: 1;

  img {
    width: 2rem;
  }

  .msg {
    font-size: 0.32rem;
    color: #4a4c5b;
    letter-spacing: 0;
    text-align: center;
    font-weight: 500;
    margin-top: 0.15rem;
  }

  .exam-card {
    width: 5.6rem;
    margin: 0.36rem auto 0;
    padding: 0.32rem 0.24rem;
    border-radius: 0.32rem;
    background: #fff;
    box-shadow: 0 0 0.32rem rgba(68, 68, 102, 0.12);

    &__label {
      font-size: 0.26rem;
      color: #8a8aa8;
      letter-spacing: 0.04rem;
    }

    &__score {
      margin-top: 0.12rem;
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 0.12rem;

      .num {
        font-size: 1.1rem;
        font-weight: 800;
        line-height: 1.1;
        color: var(--primary-color, #77eedd);
        text-shadow: 0 0.04rem 0.12rem rgba(63, 208, 189, 0.35);
      }

      .full {
        font-size: 0.3rem;
        color: #8a8aa8;
      }
    }

    &__meta {
      margin-top: 0.16rem;
      font-size: 0.26rem;
      color: #6e707c;
    }

    &__pass {
      display: inline-block;
      margin-top: 0.2rem;
      padding: 0.06rem 0.24rem;
      border-radius: 0.3rem;
      font-size: 0.24rem;
      color: #ec4e29;
      background: #ffefeb;

      &.is-pass {
        color: #2fa596;
        background: #eafcf9;
      }
    }
  }

  .reset-link {
    margin-top: 0.24rem;
    font-size: 0.27rem;
    color: #5094f0;
    text-decoration: underline;
    display: block;
  }
}
</style>
