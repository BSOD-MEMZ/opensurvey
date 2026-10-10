<template>
  <div :class="['nav-header', `${boxShadow ? 'box-shadow' : null}`]">
    <div class="left">
      <div class="logo">
        <img class="logoImg" :src="img" @click="toHomePage" />
      </div>
      <SekaiBackButton size="sm" plain @click="onBack" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import SekaiBackButton from '@/management/components/SekaiBackButton.vue'

interface Props {
  boxShadow?: boolean
}

withDefaults(defineProps<Props>(), {
  boxShadow: true
})

const img = '/imgs/s-logo.webp'

const router = useRouter()

const onBack = () => {
  router.go(-1)
}

const toHomePage = () => {
  router.push({
    name: 'survey'
  })
}
</script>

<style lang="scss" scoped>
.nav-header {
  z-index: 99;
  position: relative;
  height: 64px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .left {
    display: flex;
    align-items: center;
    .logo {
      width: 66px;
      height: 35px;
      border-right: 1px solid rgb(242, 244, 247);
      cursor: pointer;
      display: flex;
      justify-content: center;
      .logoImg {
        width: 32px;
      }
    }
    /* 返回按钮已换成 pjsk 圆形按钮（SekaiBackButton），这里只留间距 */
    :deep(.sk-back) {
      margin-left: 18px;
    }
  }
}
.box-shadow {
  box-shadow: 0 4px 8px 0 rgba(74, 76, 91, 0.08);
}
</style>
