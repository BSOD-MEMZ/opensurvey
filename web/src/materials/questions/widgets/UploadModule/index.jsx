import { computed, defineComponent, ref } from 'vue'
import './style.scss'

/**
 * 文件 / 图片上传题
 * - 单个文件：提交 url 字符串
 * - 多个文件：提交 url 字符串数组
 * - 走本地存储通道 uploadPublic（匿名答题可用，不需要登录态）
 *
 * 这里没有用 el-upload：答题端不希望为了一个上传框把 Element Plus 带进首屏包，
 * 直接手写 input[type=file] + fetch 即可。
 */
export default defineComponent({
  name: 'UploadModule',
  props: {
    type: {
      type: String,
      default: 'upload'
    },
    field: {
      type: String,
      default: ''
    },
    value: {
      type: [String, Array],
      default: ''
    },
    uploadType: {
      type: String,
      default: 'image'
    },
    fileCount: {
      type: [Number, String],
      default: 1
    },
    fileMaxSize: {
      type: [Number, String],
      default: 5
    },
    fileAccept: {
      type: String,
      default: ''
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['blur', 'focus', 'change'],
  setup(props, { emit }) {
    // 用函数式 ref 记录原生 input：render 函数里的字符串 ref 不会自动绑到 setup 的 ref 上
    let inputEl = null
    const setInputEl = (el) => {
      inputEl = el
    }

    const uploading = ref(false)
    const errorTip = ref('')

    const maxCount = computed(() => {
      const n = Number(props.fileCount)
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1
    })

    const isMultiple = computed(() => maxCount.value > 1)
    const isImage = computed(() => props.uploadType === 'image')
    const maxSize = computed(() => {
      const n = Number(props.fileMaxSize)
      return Number.isFinite(n) && n > 0 ? n : 0
    })

    const urls = computed(() => {
      const v = props.value
      if (Array.isArray(v)) return v.filter(Boolean)
      return v ? [v] : []
    })

    const canAdd = computed(() =>
      isMultiple.value ? urls.value.length < maxCount.value : urls.value.length === 0
    )

    const accept = computed(() => {
      if (props.fileAccept) return props.fileAccept
      return isImage.value ? 'image/*' : ''
    })

    const commit = (next) => {
      emit('change', { key: props.field, value: isMultiple.value ? next : next[0] || '' })
    }

    const pick = () => {
      if (props.readonly || uploading.value || !canAdd.value) return
      inputEl?.click()
    }

    const remove = (index) => {
      if (props.readonly) return
      const next = [...urls.value]
      next.splice(index, 1)
      commit(next)
    }

    const uploadOne = async (file) => {
      const form = new FormData()
      form.append('file', file)
      form.append('channel', 'uploadPublic')
      const res = await fetch('/api/file/upload', { method: 'POST', body: form })
      const json = await res.json().catch(() => null)
      if (!json || json.code !== 200 || !json.data?.url) {
        throw new Error(json?.errmsg || '上传失败')
      }
      return json.data.url
    }

    const onFileChange = async (event) => {
      const files = Array.from(event.target.files || [])
      event.target.value = ''
      if (!files.length) return

      errorTip.value = ''
      const room = maxCount.value - urls.value.length
      const picked = files.slice(0, Math.max(room, 0))

      if (maxSize.value > 0) {
        const oversize = picked.find((file) => file.size > maxSize.value * 1024 * 1024)
        if (oversize) {
          errorTip.value = `「${oversize.name}」超过 ${maxSize.value}MB 上限`
          return
        }
      }

      uploading.value = true
      try {
        const added = []
        for (const file of picked) {
          added.push(await uploadOne(file))
        }
        commit([...urls.value, ...added])
      } catch (err) {
        errorTip.value = err?.message || '上传失败，请重试'
      } finally {
        uploading.value = false
      }
    }

    return {
      setInputEl,
      uploading,
      errorTip,
      maxCount,
      maxSize,
      isMultiple,
      isImage,
      urls,
      accept,
      canAdd,
      pick,
      remove,
      onFileChange
    }
  },
  render() {
    const { urls, isImage, isMultiple, maxCount, uploading, errorTip, accept, readonly, canAdd } = this

    return (
      <div class={['upload-wrapper', isImage ? 'is-image' : 'is-file']}>
        <input
          ref={this.setInputEl}
          class="upload-input"
          type="file"
          accept={accept || undefined}
          multiple={isMultiple}
          onChange={(event) => this.onFileChange(event)}
        />

        <div class="upload-list">
          {urls.map((url, index) => (
            <div class="upload-item" key={`${url}-${index}`}>
              {isImage ? (
                <img class="upload-thumb" src={url} alt="" />
              ) : (
                <a class="upload-file" href={url} target="_blank" rel="noreferrer">
                  {decodeURIComponent(String(url).split('/').pop() || '文件')}
                </a>
              )}
              {!readonly && (
                <button
                  type="button"
                  class="upload-remove"
                  title="移除"
                  onClick={() => this.remove(index)}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {!readonly && canAdd && (
            <div
              class={['upload-trigger', uploading ? 'is-loading' : '']}
              onClick={this.pick}
              role="button"
            >
              {uploading ? '上传中…' : isImage ? '＋ 图片' : '＋ 文件'}
            </div>
          )}
        </div>

        <p class="upload-tip">
          {isImage ? '图片' : '文件'}：最多 {maxCount} 个
          {Number(this.maxSize) > 0 ? `，单个不超过 ${this.maxSize}MB` : ''}
        </p>
        {errorTip && <p class="upload-error">{errorTip}</p>}
      </div>
    )
  }
})
