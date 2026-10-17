<template>
  <div class="channel-page">
    <TopNav class="top" />
    <SurveyNav class="survey" />

    <div class="content">
      <!-- 左侧：实时预览。已发布走真实链接，未发布走编辑器预览通道（都看得到真实效果） -->
      <div class="preview-container" :style="{ backgroundImage: `url('${backgroundImage}')` }">
        <iframe :src="previewSrc"></iframe>
      </div>

      <div class="container-content">
        <template v-if="curStatus !== 'new'">
          <div class="box-link">
            <h2>问卷链接</h2>
            <div class="main-channel-wrap">
              <ChannelRow
                :disable-delete="true"
                :data="mainChannel"
                :style-wrap="{ marginBottom: '8px' }"
              />
            </div>
          </div>

          <br />
          <div class="box-channelList" v-if="channelTotal > 0">
            <h2>投放列表</h2>
            <div class="main-channel-wrap">
              <ChannelList />
            </div>
          </div>
          <div class="box-channelList">
            <h2>投放方式</h2>
            <div class="main-channel-wrap">
              <ChannelCards />
            </div>
          </div>
        </template>
        <template v-else>
          <!-- 未发布：右侧给状态说明，但左侧依然能预览，不必先发布再自己走一遍 -->
          <EmptyIndex :data="defaultConfig" />
        </template>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, toRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditStore } from '@/management/stores/edit'
import { useChannelStore } from '@/management/stores/channel'
import { useRoute, useRouter } from 'vue-router'
import { get as _get } from 'lodash-es'

import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/src/message.scss'

import EmptyIndex from '@/management/components/EmptyIndex.vue'
import TopNav from '@/management/components/TopNav.vue'
import SurveyNav from '@/management/components/SurveyNav.vue'
import ChannelRow from './components/ChannelRow.vue'
import ChannelList from './components/ChannelList.vue'
import ChannelCards from './components/ChannelCards.vue'

const backgroundImage = '/imgs/phone-bg.webp'
const defaultConfig = {
  title: '问卷未发布',
  desc: '左侧可以直接预览效果；确认无误后，到「问卷编辑」右上角点击「发布」，就能对外投放了。',
  img: '/imgs/icons/unpublished.webp'
}
const channelStore = useChannelStore()
const editStore = useEditStore()
const { schema, init, setSurveyId } = editStore

const { channelTotal } = storeToRefs(channelStore)
const metaData = toRef(schema, 'metaData')
const curStatus = computed(() => _get(metaData.value, 'curStatus.status', 'new'))
const mainChannel = computed(() => {
  let fullUrl = ''

  if (metaData.value) {
    fullUrl = `${location.origin}/render/${(metaData.value as any).surveyPath}?t=${Date.now()}`
  }

  return { fullUrl }
})

const route = useRoute()
const router = useRouter()
const surveyId = computed(() => String(route.params.id || ''))

// 未发布时 /render/{surveyPath} 还没有效内容，改走编辑器的预览通道，
// 保证「投放页任何时候都能先看一眼效果」。
const previewSrc = computed(() =>
  curStatus.value === 'new'
    ? `/management/preview/${surveyId.value}`
    : `${mainChannel.value.fullUrl}`
)

onMounted(async () => {
  setSurveyId(route.params.id as string)

  try {
    await init()
  } catch (err: any) {
    ElMessage.error(err.message)
    setTimeout(() => {
      router.replace({ name: 'survey' })
    }, 1000)
  }
  channelStore.getChannelList({
    surveyId: route.params.id as string,
    curPage: 1
  })
})
</script>
<style lang="scss" scoped>
.channel-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .top,
  .survey {
    flex: none;
  }

  .content {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: stretch;
    padding: 20px;
    gap: 24px;
    background: #f6f7f9;
    overflow: auto;
  }
}

.preview-container {
  width: 390px;
  height: 700px;
  flex: 0 0 auto;
  overflow: hidden;
  padding: 107px 38px 57px 38px;
  background-position: 0 0;
  background-size: 100% 100%;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
}

.container-content {
  flex: 1;
  min-width: 620px;
  background-color: #fff;
  border-radius: 4px;
  padding: 30px 30px 80px;

  .launch-tip {
    font-size: 12px;
    color: #fa881a;
  }

  h2 {
    font-family: PingFangSC-Medium;
    margin: 20px 0;
    font-size: 18px;
    color: #4a4c5b;
    letter-spacing: 0;
    line-height: 26px;
  }
}
</style>
