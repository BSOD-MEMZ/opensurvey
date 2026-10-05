<template>
  <div class="image-upload-setter">
    <el-input size="small" v-model="inputValue" :placeholder="placeholder">
      <template #append>
        <el-upload
          ref="upload"
          class="upload-img"
          action="/api/file/upload"
          :accept="accept"
          :limit="1"
          :show-file-list="false"
          :data="{ channel: 'upload' }"
          :on-exceed="handleExceed"
          :headers="{
            Authorization: `Bearer ${token}`
          }"
          :before-upload="beforeUpload"
          :on-success="onSuccess"
        >
          <i-ep-upload />
        </el-upload>
      </template>
    </el-input>

    <!-- 有值就出缩略图，避免"传了什么图"全靠猜 -->
    <div v-if="inputValue" class="preview">
      <img class="preview-img" :src="inputValue" alt="预览" />
      <div class="preview-actions">
        <span class="preview-tip">{{ hintText }}</span>
        <el-button link size="small" @click="clear">移除</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage, genFileId } from 'element-plus'
import { get as _get } from 'lodash-es'
import type { UploadInstance, UploadProps, UploadRawFile } from 'element-plus'
import { useUserStore } from '@/management/stores/user'
import { FORM_CHANGE_EVENT_KEY } from '@/materials/setters/constant'

interface IProps {
  formConfig: any
}
interface IEmit {
  (ev: typeof FORM_CHANGE_EVENT_KEY, arg: { key: string; value: string }): void
}

const props = defineProps<IProps>()
const emit = defineEmits<IEmit>()

const upload = ref<UploadInstance>()
const userStore = useUserStore()
const token = _get(userStore, 'userInfo.token')

const inputValue = ref(props.formConfig.value || '')

const accept = computed(() => props.formConfig.accept || 'image/*')
const placeholder = computed(() => props.formConfig.placeholder || '图片地址，或点右侧按钮上传')
const hintText = computed(() => props.formConfig.hint || '')

// 建议宽度：头图 / 海报这类需要固定比例的，提示一下免得裁切意外
const limitSize = computed(() => props.formConfig.limitSize || 5)

watch(inputValue, (newValue) => {
  emit(FORM_CHANGE_EVENT_KEY, { key: props.formConfig.key, value: newValue })
})

watch(
  () => props.formConfig.value,
  (newValue) => {
    if (newValue !== inputValue.value) inputValue.value = newValue || ''
  }
)

const handleExceed: UploadProps['onExceed'] = (files) => {
  upload.value!.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  upload.value!.handleStart(file)
}

function onSuccess(response: any) {
  const url = response?.data?.url
  if (url) {
    inputValue.value = url
    emit(FORM_CHANGE_EVENT_KEY, { key: props.formConfig.key, value: url })
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response?.errmsg || '上传失败')
  }
}

const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const max = limitSize.value
  if (max && rawFile.size / 1024 / 1024 > max) {
    ElMessage.error(`文件大小不得超过 ${max}MB`)
    return false
  }
  return true
}

function clear() {
  inputValue.value = ''
  emit(FORM_CHANGE_EVENT_KEY, { key: props.formConfig.key, value: '' })
}
</script>

<style lang="scss" scoped>
.image-upload-setter {
  width: 100%;
}

:deep(.el-input-group__append) {
  padding: 0;
  box-sizing: border-box;

  .upload-img .el-upload {
    width: 32px;
    height: 32px;
  }
}

.preview {
  margin-top: 8px;
  padding: 8px;
  border: 1px solid #e6e9f2;
  border-radius: 8px;
  background: #fafbfe;
}

.preview-img {
  display: block;
  width: 100%;
  max-height: 120px;
  object-fit: contain;
  border-radius: 6px;
  background: #fff;
}

.preview-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.preview-tip {
  font-size: 12px;
  color: #8a8aa8;
}
</style>
