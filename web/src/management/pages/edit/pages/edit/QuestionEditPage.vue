<template>
  <CommonTemplate>
    <template #left>
      <CatalogPanel />
    </template>
    <template #center>
      <PreviewPanel />
    </template>
    <template #right>
      <SetterPanel />
    </template>
  </CommonTemplate>
</template>
<script setup lang="ts">
import CommonTemplate from '../../components/CommonTemplate.vue'
import CatalogPanel from '../../modules/questionModule/CatalogPanel.vue'
import PreviewPanel from '../../modules/questionModule/PreviewPanel.vue'
import SetterPanel from '../../modules/questionModule/SetterPanel.vue'
</script>
<style lang="scss" scoped>
/* 编辑页外壳已交给 CommonTemplate 做玻璃化，这里不再画分割线 */
</style>
