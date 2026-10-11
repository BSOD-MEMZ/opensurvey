<template>
  <div class="content">
    <template v-for="route in routes" :key="route.key">
      <router-link
        :to="{ name: route.router }"
        replace
        v-slot="{ href, navigate, isActive, isExactActive }"
        custom
      >
        <div
          :class="[
            'navbar-btn',
            (isActive && ['skinsettings', 'edit'].includes(route.key)) || isExactActive
              ? 'router-link-exact-active'
              : ''
          ]"
        >
          <a :href="href" @click="navigate">
            <i class="iconfont" :class="[route.icon]"></i>
            <span>{{ route.text }}</span></a
          >
        </div>
      </router-link>
    </template>
  </div>
</template>
<script setup lang="ts">
const routes = [
  {
    icon: 'icon-wenjuanbianji',
    text: '问卷编辑',
    router: 'QuestionEditIndex',
    key: 'edit',
    next: true
  },
  {
    icon: 'icon-wenjuanshezhi',
    text: '问卷设置',
    router: 'QuestionEditSetting',
    key: 'settings',
    next: true
  },
  {
    icon: 'icon-yangshishezhi',
    text: '皮肤设置',
    router: 'QuestionSkinSetting',
    key: 'skinsettings',
    next: true
  }
]
</script>
<style lang="scss" scoped>
.content {
  display: flex;
  align-items: center;
  justify-content: center;

  .navbar-btn {
    position: relative;
    /* 之前是 #92949d，压在浅色渐变背景上几乎看不清，加深一档 */
    color: var(--sk-ink-2, #5d5d80);
    padding: 0 20px;
    cursor: pointer;
    transition: color 0.16s ease;

    a {
      color: inherit;
    }

    &:hover {
      color: var(--sk-teal-deep, #2fa596);
    }

    &.router-link-exact-active {
      color: var(--sk-ink, #444466);
      font-weight: 700;

      &::before {
        content: '';
        position: absolute;
        width: 90px;
        height: 3px;
        border-radius: 999px;
        background-color: var(--sk-teal, #77eedd);
        bottom: -16px;
        left: 20px;
        z-index: 99;
      }
    }

    .iconfont {
      margin-right: 12px;
    }
  }
}
</style>
