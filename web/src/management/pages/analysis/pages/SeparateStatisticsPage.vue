<template>
  <div v-if="data.length" class="separate-statis-page">
    <StatisticsItem v-for="StatisticsData in data" :key="StatisticsData.field" :StatisticsData />
  </div>
  <div v-else>
    <EmptyIndex :data="noDataConfig" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/src/message.scss'
import { noDataConfig } from '@/management/config/analysisConfig'
import EmptyIndex from '@/management/components/EmptyIndex.vue'
import { getStatisticList } from '@/management/api/analysis'
import StatisticsItem from '../components/StatisticsItem.vue'

const route = useRoute()

const data = ref([])

const initData = async () => {
  try {
    const res = await getStatisticList({
      surveyId: route.params.id
    })
    if (res.code === 200) {
      data.value = res?.data || []
    } else {
      ElMessage.error(res?.errmsg)
    }
  } catch (error) {
    ElMessage.error(error?.message || '查询回收数据失败，请重试')
  }
}

onMounted(initData)
</script>

<style lang="scss" scoped>
.separate-statis-page {
  height: 100%;
  /* 透明：让 pjsk 渐变背景透上来，每道题自己是一张玻璃卡 */
  background: transparent;
  padding: 18px 24px 40px;
  overflow-y: auto;
}
</style>
