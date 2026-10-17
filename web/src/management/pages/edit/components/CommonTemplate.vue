<template>
  <div class="main">
    <div class="nav" v-if="slots.nav">
      <slot name="nav"></slot>
    </div>
    <div class="body">
      <slot v-if="slots.body" name="body"></slot>
      <template v-else>
        <div class="left" v-if="slots.left">
          <slot name="left"></slot>
        </div>
        <div class="center" v-if="slots.center">
          <slot name="center"></slot>
        </div>
        <div class="right" v-if="slots.right">
          <slot name="right"></slot>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { useSlots } from 'vue'

const slots = useSlots()
</script>

<style lang="scss" scoped>
.main {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .nav {
    flex-basis: 56px;
  }

  .body {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    /* 三栏之间留出缝，让底下的 pjsk 渐变背景透出来，整体不那么"硬"。
       左侧原来顶到 0 是因为外面有 80px 的左侧竖排导航占位，导航已并入顶栏，这里补回来。 */
    gap: 16px;
    padding: 0 16px 16px;

    .left,
    .center,
    .right {
      height: 100%;
      border-radius: var(--sk-r-lg, 18px);
      overflow: hidden;
    }

    .left,
    .right {
      flex-grow: 0;
      flex-shrink: 0;
      /* 玻璃面板：面板自己的白底都是透明的，靠这一层来出质感 */
      background: var(--sk-glass, rgba(255, 255, 255, 0.72));
      -webkit-backdrop-filter: blur(12px);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 8px 26px rgba(68, 68, 102, 0.1);
    }

    .center {
      flex: 1;
    }
  }
}
</style>
