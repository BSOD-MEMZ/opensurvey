<template>
  <div class="nav">
    <LogoIcon />
    <template v-for="(tab, index) in tabs" :key="tab.text + index">
      <router-link :to="tab.to" v-slot="{ isActive }" :replace="true">
        <div
          :class="[
            'tab-btn',
            ([
              'QuestionEditIndex',
              'QuestionEditSetting',
              'QuestionSkinSetting',
              'QuestionEditResultConfig'
            ].includes(route.name) &&
              tab.to.name === 'QuestionEditIndex') ||
            isActive
              ? 'router-link-active'
              : ''
          ]"
        >
          <div class="icon">
            <i class="iconfont" :class="tab.icon"></i>
          </div>
          <p>{{ tab.text }}</p>
        </div>
      </router-link>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
import LogoIcon from './LogoIcon.vue'

// 协作功能已下线，不再按协作权限过滤菜单，三个目录恒定展示
const tabs = ref([
  {
    text: '编辑问卷',
    icon: 'icon-bianji',
    to: {
      name: 'QuestionEditIndex'
    }
  },
  {
    text: '投放问卷',
    icon: 'icon-toufang',
    to: {
      name: 'channel'
    }
  },
  {
    text: '数据统计',
    icon: 'icon-shujutongji',
    to: {
      name: 'analysisPage'
    }
  }
])
</script>
<style lang="scss" scoped>
.nav {
  width: 80px;
  height: 100%;
  /* 左侧栏也走玻璃：别在渐变背景上压一整块死白 */
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 4px 0 18px rgba(68, 68, 102, 0.08);
  font-size: 12px;
  padding-top: 6px;
}

.tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  color: $normal-color-light;

  &:hover {
    color: $normal-color;

    .icon {
      background-color: $disable-color;
    }
  }

  .icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 5px;
    border-radius: 999px;
    transition: background-color 0.16s ease, color 0.16s ease;

    .iconfont {
      font-size: 20px;
      line-height: 1;
    }
  }

  p {
    font-size: 12px;
  }

  &.router-link-active {
    background-color: transparent;
    color: var(--sk-teal-ink, #1f8a7d);

    .icon {
      background-color: var(--sk-teal, #77eedd);
      color: #2f3a5c;
      box-shadow: 0 4px 12px rgba(119, 238, 221, 0.5);
    }
  }
}
</style>
