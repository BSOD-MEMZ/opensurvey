<template>
  <div class="luck-setter">
    <div class="luck-setter__switch">
      <el-switch v-model="conf.enable" @change="commit" />
      <span class="luck-setter__switch-tip">{{
        conf.enable ? '已开启：提交成功后可以转盘抽奖' : '开启后，答题者提交成功页会出现抽奖转盘'
      }}</span>
    </div>

    <template v-if="conf.enable">
      <el-input
        v-model="conf.title"
        class="luck-setter__title"
        placeholder="转盘上方的标题，如：恭喜完成！转个盘吧"
        @change="commit"
      />

      <div class="luck-setter__prizes">
        <div v-for="(prize, index) in conf.prizes" :key="index" class="prize-card">
          <div class="prize-card__head">
            <span class="prize-card__no">奖项 {{ index + 1 }}</span>
            <span class="prize-card__rate">
              实际概率
              <b>{{ (probabilities[index] * 100).toFixed(1) }}%</b>
            </span>
            <el-button
              link
              size="small"
              type="danger"
              :disabled="conf.prizes.length <= 2"
              @click="removePrize(index)"
            >
              删除
            </el-button>
          </div>

          <div class="prize-card__row">
            <span class="prize-card__icon">
              <img v-if="isImageIcon(prize.icon)" :src="prize.icon" alt="" />
              <template v-else>{{ prize.icon || '🎁' }}</template>
            </span>
            <el-input v-model="prize.icon" size="small" placeholder="图标：emoji / 文字" @change="commit">
              <template #append>
                <el-upload
                  class="upload-icon"
                  action="/api/file/upload"
                  accept="image/*"
                  :limit="1"
                  :show-file-list="false"
                  :data="{ channel: 'upload' }"
                  :headers="{ Authorization: `Bearer ${token}` }"
                  :on-success="(res: any) => onUploadSuccess(res, prize)"
                >
                  <i-ep-upload />
                </el-upload>
              </template>
            </el-input>
          </div>

          <div class="prize-card__row">
            <el-input v-model="prize.name" size="small" placeholder="奖品名称，如 一等奖" @change="commit" />
            <el-input-number
              v-model="prize.rate"
              size="small"
              :min="0"
              :max="10000"
              :step="1"
              controls-position="right"
              @change="commit"
            />
          </div>
        </div>
      </div>

      <div class="luck-setter__actions">
        <el-button size="small" :disabled="conf.prizes.length >= 10" @click="addPrize">
          + 添加奖项
        </el-button>
        <span class="luck-setter__hint">爆率是相对权重（不必凑够 100），系统按总和归一化</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { get as _get } from 'lodash-es'

import {
  createDefaultLuckDrawConf,
  isImageIcon,
  normalizePrizes,
  prizeProbabilities,
  type LuckDrawConf,
  type LuckPrize
} from '@/common/luckDraw'
import { useUserStore } from '@/management/stores/user'
import { FORM_CHANGE_EVENT_KEY } from '@/materials/setters/constant'

interface Props {
  formConfig: any
}

const props = defineProps<Props>()
const emit = defineEmits<{ (ev: typeof FORM_CHANGE_EVENT_KEY, arg: { key: string; value: any }): void }>()

const userStore = useUserStore()
const token = _get(userStore, 'userInfo.token')

const buildConf = (value: any): LuckDrawConf => {
  const fallback = createDefaultLuckDrawConf()
  if (!value || typeof value !== 'object') return fallback
  return {
    enable: Boolean(value.enable),
    title: typeof value.title === 'string' ? value.title : fallback.title,
    prizes: normalizePrizes(value.prizes).length ? normalizePrizes(value.prizes) : fallback.prizes
  }
}

const conf = ref<LuckDrawConf>(buildConf(props.formConfig?.value))

const probabilities = computed(() => prizeProbabilities(conf.value.prizes))

watch(
  () => props.formConfig?.value,
  (value) => {
    const next = buildConf(value)
    // 只在外部值真的变了才回灌，避免打字时被自己的 emit 冲掉
    if (JSON.stringify(next) !== JSON.stringify(conf.value)) {
      conf.value = next
    }
  },
  { deep: true }
)

const commit = () => {
  emit(FORM_CHANGE_EVENT_KEY, {
    key: props.formConfig?.key || 'luckDrawConf',
    value: {
      ...conf.value,
      prizes: conf.value.prizes.map((item) => ({ ...item }))
    }
  })
}

const addPrize = () => {
  if (conf.value.prizes.length >= 10) return
  const next: LuckPrize = { name: `奖项${conf.value.prizes.length + 1}`, icon: '🎁', rate: 10 }
  conf.value.prizes.push(next)
  commit()
}

const removePrize = (index: number) => {
  if (conf.value.prizes.length <= 2) return
  conf.value.prizes.splice(index, 1)
  commit()
}

const onUploadSuccess = (response: any, prize: LuckPrize) => {
  const url = response?.data?.url
  if (!url) {
    ElMessage.error(response?.errmsg || '上传失败')
    return
  }
  prize.icon = url
  commit()
  ElMessage.success('图标已上传')
}
</script>

<style lang="scss" scoped>
.luck-setter {
  width: 100%;

  &__switch {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__switch-tip {
    font-size: 12px;
    color: #8a8aa8;
    line-height: 1.5;
  }

  &__title {
    margin-top: 14px;
  }

  &__prizes {
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__actions {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  }

  &__hint {
    font-size: 12px;
    color: #a0a3b8;
    line-height: 1.5;
  }
}

.prize-card {
  border: 1px solid #e6e9f2;
  border-radius: 10px;
  padding: 10px;
  background: #fbfcff;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__no {
    font-size: 12px;
    font-weight: 700;
    color: #444466;
  }

  &__rate {
    margin-left: auto;
    font-size: 12px;
    color: #8a8aa8;

    b {
      color: #2fa596;
    }
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }

  &__icon {
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #fff;
    border: 1px solid #e6e9f2;
    font-size: 18px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  :deep(.el-input-number) {
    width: 108px;
    flex: none;
  }

  :deep(.el-input-group__append) {
    padding: 0;

    .upload-icon .el-upload {
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
    }
  }
}
</style>
