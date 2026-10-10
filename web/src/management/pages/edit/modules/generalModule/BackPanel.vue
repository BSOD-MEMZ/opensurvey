<template>
  <!-- 编辑器左上角返回：pjsk 圆形按钮（原来是 iconfont 箭头 + “返回”文字） -->
  <SekaiBackButton size="sm" plain title="返回问卷列表" @click="handleNavigateHome" />
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router'
import SekaiBackButton from '@/management/components/SekaiBackButton.vue'

const router = useRouter()
const handleNavigateHome = () => {
  router.push({
    name: 'survey'
  })
}
</script>
