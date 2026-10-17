<template>
  <div class="top-nav">
    <div class="left">
      <img class="logo-img" src="/imgs/Logo.webp" alt="logo" @click="toSurvey" />
      <el-menu
        :default-active="activeMenu"
        class="el-menu-demo"
        mode="horizontal"
        @select="onSelect"
      >
        <el-menu-item index="survey">问卷列表</el-menu-item>
        <el-menu-item index="download">下载中心</el-menu-item>
      </el-menu>
    </div>
    <div class="login-info">
      您好，{{ userInfo?.username }}
      <img class="login-info-img" src="/imgs/avatar.webp" />
      <span class="logout" @click="handleLogout">退出</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/management/stores/user'
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
const router = useRouter()
const route = useRoute()

const userStore = useUserStore()
const userInfo = computed(() => {
  return userStore.userInfo
})

// 之前写的是 default-active-index（Element Plus 里没有这个属性），等于没生效，
// 结果是菜单永远不高亮当前页。这里改成受控的 default-active。
const activeMenu = computed(() => {
  const name = String(route.name || '')
  if (name === 'download') return 'download'
  return 'survey'
})

const onSelect = (index: string) => {
  if (index === activeMenu.value) return
  router.push({ name: index })
}

const toSurvey = () => router.push({ name: 'survey' })

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('退出后需要重新登录才能继续使用，是否退出？', '退出登录', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  userStore.logout()
  router.replace({ name: 'login' })
}
</script>

<style lang="scss" scoped>
.top-nav {
  /* 走玻璃：所有页面（含带 pjsk 渐变背景的编辑器/统计页）都能透出底色 */
  background: rgba(255, 255, 255, 0.82);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  color: #4a4c5b;
  padding: 0 20px;
  height: 56px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(230, 233, 242, 0.9);
  position: relative;
  z-index: 60;
  .left {
    display: flex;
    align-items: center;
    width: calc(100% - 200px);
    .logo-img {
      width: 90px;
      height: fit-content;
      padding-right: 20px;
      cursor: pointer;
    }
    .el-menu {
      width: 100%;
      height: 56px;
      border: none !important;
      background: transparent;
      :deep(.el-menu-item) {
        border: none !important;
        background: transparent;
      }
      :deep(.el-menu-item.is-active) {
        border-bottom: 2px solid $primary-color !important;
        color: $primary-color;
      }
    }
  }
  .login-info {
    display: flex;
    align-items: center;
    .login-info-img {
      margin-left: 10px;
      height: 30px;
      margin-top: -6px;
    }

    .logout {
      margin-left: 20px;
    }
  }

  span {
    cursor: pointer;
    color: #3fd0bd;
  }
}
</style>
