<template>
  <div class="image-options-setter">
    <div v-for="(item, index) in list" :key="item.hash" class="option-row">
      <div class="thumb-box">
        <img v-if="item.image" :src="item.image" class="thumb" alt="" />
        <span v-else class="thumb-empty">无图</span>
        <el-upload
          class="thumb-upload"
          action="/api/file/upload"
          accept="image/*"
          :show-file-list="false"
          :data="{ channel: 'upload' }"
          :headers="{ Authorization: `Bearer ${token}` }"
          :on-success="(res, file) => onImageSuccess(res, index)"
        >
          <span class="thumb-btn">上传</span>
        </el-upload>
      </div>

      <div class="fields">
        <el-input
          v-model="item.text"
          size="small"
          placeholder="选项文案"
          @change="commit"
        />
        <el-input
          v-model="item.image"
          size="small"
          placeholder="图片地址，或点左侧上传"
          @change="commit"
        />
      </div>

      <el-button link type="danger" :disabled="list.length <= 1" @click="removeOption(index)">
        删除
      </el-button>
    </div>

    <el-button link type="primary" @click="addOption">＋ 添加选项</el-button>
    <p class="tip">每行一个选项；图片用于答题端展示，文案可留空表示只显示图片。</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { get as _get } from 'lodash-es'

import { FORM_CHANGE_EVENT_KEY } from '@/materials/setters/constant'
import { hashGen } from '@/materials/questions/common/utils/getOptionHash'
import { useUserStore } from '@/management/stores/user'

interface Props {
  formConfig: any
}

interface Emit {
  (ev: typeof FORM_CHANGE_EVENT_KEY, arg: { key: string; value: any }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const userStore = useUserStore()
const token = _get(userStore, 'userInfo.token')

const normalize = (options: any) => {
  if (!Array.isArray(options)) return []
  return options.map((item) => ({
    text: item?.text ?? '',
    image: item?.image ?? '',
    others: item?.others ?? false,
    mustOthers: item?.mustOthers ?? false,
    othersKey: item?.othersKey ?? '',
    placeholderDesc: item?.placeholderDesc ?? '',
    hash: item?.hash || hashGen.getHash()
  }))
}

const list = ref(normalize(props.formConfig.value))

watch(
  () => props.formConfig.value,
  (value) => {
    const next = normalize(value)
    // 只在结构真的变化时回填，避免输入过程中被覆盖
    if (next.length !== list.value.length) {
      list.value = next
    }
  }
)

const commit = () => {
  emit(FORM_CHANGE_EVENT_KEY, {
    key: props.formConfig.key || 'options',
    value: list.value.map((item) => ({ ...item }))
  })
}

const addOption = () => {
  list.value.push({
    text: `选项${list.value.length + 1}`,
    image: '',
    others: false,
    mustOthers: false,
    othersKey: '',
    placeholderDesc: '',
    hash: hashGen.getHash()
  })
  commit()
}

const removeOption = (index: number) => {
  if (list.value.length <= 1) return
  list.value.splice(index, 1)
  commit()
}

const onImageSuccess = (res: any, index: number) => {
  if (res?.code === 200 && res?.data?.url) {
    list.value[index].image = res.data.url
    commit()
  }
}
</script>

<style lang="scss" scoped>
.image-options-setter {
  .option-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;

    .thumb-box {
      position: relative;
      flex: 0 0 auto;
      width: 56px;
      height: 56px;
      border: 1px dashed #cfd6e6;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f4f6fb;

      .thumb {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .thumb-empty {
        font-size: 11px;
        color: #8a8aa8;
      }

      .thumb-upload {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        text-align: center;
      }

      .thumb-btn {
        display: block;
        font-size: 11px;
        line-height: 16px;
        color: #fff;
        background: rgba(68, 68, 102, 0.72);
        cursor: pointer;
      }
    }

    .fields {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }
  }

  .tip {
    margin: 6px 0 0;
    font-size: 12px;
    color: #92949d;
    line-height: 1.5;
  }
}
</style>
