<template>
  <div class="channel-cards">
    <div
      class="channel-card"
      :class="{ 'is-disabled': !isAvailable(item) }"
      v-for="(item, index) in data"
      :key="index"
      @click="(e) => handleClick(e, item)"
    >
      <div class="header">
        <div class="title">
          <i :class="['iconfont channel_icon',CHANNEL_TYPE_ICON[item as CHANNEL_TYPE] ] "></i>
          <span class="name">{{ CHANNEL_TYPE_TEXT[item] }}</span>
          <!-- 未上线的方式直接标出来，别让用户逐个点开才知道不能用 -->
          <span class="badge" v-if="!isAvailable(item)">即将上线</span>
        </div>
        <span class="intro" v-if="item == CHANNEL_TYPE.INJECT_APP" @click="handleIntroOpen">
          接入说明 <el-icon><ArrowRight /></el-icon>
        </span>
      </div>
      <div class="content">
        <div class="desc">{{ CHANNEL_TYPE_DSEC[item] }}</div>
      </div>
    </div>
  </div>
  <ChannelModify
    :visible="dialogVisible"
    title="新增投放"
    @confirm="handleConfirm"
    @close="handleClose"
  />
  <el-dialog
    v-model="introVisible"
    width="800"
    :before-close="handleIntroClose"
  >
  <template #title>
      <div class="channel-dialog-title">
        SDK接入方式
      </div>
    </template>
    <CodeBlock :surveyPath="getSurveyPath" />
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleIntroClose">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>   
<script lang="ts" setup>
import { ref, computed } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import { CHANNEL_TYPE_ICON, CHANNEL_TYPE, CHANNEL_TYPE_TEXT } from '@/management/enums/channel'
import { useChannelStore } from '@/management/stores/channel'
import { ElMessageBox } from 'element-plus'
import CodeBlock from './CodeBlock.vue'
import ChannelModify from './ChannelModify.vue'
import { useEditStore } from '@/management/stores/edit' 
import { storeToRefs  } from 'pinia'

const editStore = useEditStore()
const { surveyId, schema } = storeToRefs(editStore)
const channelStore = useChannelStore()
const CHANNEL_TYPE_DSEC = {
  [CHANNEL_TYPE.SHORT_LINK]: '生成一条短链，适合短信、社群等场景直接分发。',
  [CHANNEL_TYPE.INJECT_WEB]: "将问卷通过SDK方式嵌入到网页中，适合弹窗、信息流等。",
  [CHANNEL_TYPE.INJECT_APP]: "将问卷通过SDK方式嵌入到IOS、Android等应用中。",
  [CHANNEL_TYPE.INJECT_MP]: "将问卷通过SDK嵌入到小程序中，在小程序中进行调查收集。",
}

const data = [
  CHANNEL_TYPE.INJECT_APP,
  // CHANNEL_TYPE.SHORT_LINK,
  CHANNEL_TYPE.INJECT_WEB,
  
  CHANNEL_TYPE.INJECT_MP
]
// 目前只有 APP 嵌入式真正可用，其余置灰并标「即将上线」
const AVAILABLE_TYPES: CHANNEL_TYPE[] = [CHANNEL_TYPE.INJECT_APP]
const isAvailable = (type: CHANNEL_TYPE) => AVAILABLE_TYPES.includes(type)
const dialogVisible = ref(false)
const curType = ref('')
const getSurveyPath = computed(() => {
  return (schema.value?.metaData as any).surveyPath || ''
})
const handleClick = (e: any, type: CHANNEL_TYPE) => {
  e.stopPropagation()
  e.preventDefault()
  if (!isAvailable(type)) return
  curType.value = type
  switch (type) {
    case CHANNEL_TYPE.INJECT_APP:
      dialogVisible.value = true
      break;
    default:
      ElMessageBox.alert(`${CHANNEL_TYPE_TEXT[type]}方式即将上线，敬请期待`, '提示')
      break;
  }
}
const handleConfirm = async (name: string) => {
  await channelStore.createChannel({
    name,
    surveyId: surveyId.value,
    type: curType.value
  })
  dialogVisible.value = false
}
const handleClose = () => {
  dialogVisible.value = false
}
let introVisible = ref(false)
const handleIntroOpen = (e: any) => {
  e.stopPropagation()
  e.preventDefault()
  introVisible.value = true
}
const handleIntroClose = () => {
  introVisible.value = false
}
</script> 
<style lang="scss" scoped>
.channel-cards {
  // width:  100%;
  display: flex;

  .channel-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin: 0 20px 20px 0;
    background: #fff;
    border: 1px solid rgba(227,228,232,1);
    border-radius: 4px;
    overflow: hidden;
    
    cursor: pointer;
    transition: all .3s;

    /* 未上线的方式：视觉上就明确不可点，不再靠点一下弹「即将上线」告诉用户 */
    &.is-disabled {
      cursor: not-allowed;
      opacity: 0.6;

      .name {
        color: #92949d;
      }

      .content:hover {
        background: transparent;
      }
    }
    
    .header{
      display: flex;
      height: 46px;
      padding: 0 12px;
      justify-content: space-between;
      align-items: center;
      line-height: 24px;
      background: #f6f7f9;
      .intro {
        font-size: 12px;
        // &:hover{
          color: #3FD0BD;
        // }
      }
      .name{
        font-size: 16px;
        color: #2d2e33;
      }
    }
    .content{
      padding: 12px;
      flex: 1;
      color: #6E707C;
      &:hover {
        background:#fff;
      }
    }
  }

  .title {
    display: flex;
    align-items: center;
    .channel_icon {
      font-size: 20px;
      margin-right: 8px;
      color: #92949D;
    }

    .badge {
      margin-left: 8px;
      padding: 1px 8px;
      font-size: 11px;
      line-height: 16px;
      color: #b8860b;
      background: #fdf6ec;
      border: 1px solid #f5e2c4;
      border-radius: 999px;
    }
  }
}
</style>
<style>
  .channel-dialog-title {
    font-family: PingFangSC-Medium;
    font-size: 24px;
    color: #292A36;
    letter-spacing: 0;
    line-height: 36px;
    font-weight: 500;
  }
</style>