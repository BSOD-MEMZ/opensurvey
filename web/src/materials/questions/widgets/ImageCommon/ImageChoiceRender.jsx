import { computed, defineComponent } from 'vue'
import { filterXSS } from '@/common/xss'
import './style.scss'

/**
 * 图片单选 / 图片多选 的共享渲染组件
 * image-radio：提交选中项的 hash
 * image-checkbox：提交选中项 hash 数组
 */
export default defineComponent({
  name: 'ImageChoiceRender',
  props: {
    type: {
      type: String,
      default: 'image-radio'
    },
    field: {
      type: String,
      default: ''
    },
    value: {
      type: [String, Array],
      default: ''
    },
    options: {
      type: Array,
      default: () => []
    },
    columns: {
      type: [Number, String],
      default: 3
    },
    showOptionText: {
      type: Boolean,
      default: true
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['change'],
  setup(props, { emit }) {
    const isMultiple = computed(() => props.type === 'image-checkbox')

    const items = computed(() => (Array.isArray(props.options) ? props.options : []))

    const colCount = computed(() => {
      const n = Number(props.columns)
      return Number.isFinite(n) && n >= 2 && n <= 5 ? Math.floor(n) : 3
    })

    const pickedList = computed(() => {
      const v = props.value
      if (isMultiple.value) return Array.isArray(v) ? v : []
      return v ? [v] : []
    })

    const isPicked = (option) => pickedList.value.includes(option.hash)

    const pick = (option) => {
      if (props.readonly) return
      if (isMultiple.value) {
        const next = isPicked(option)
          ? pickedList.value.filter((hash) => hash !== option.hash)
          : [...pickedList.value, option.hash]
        emit('change', { key: props.field, value: next })
      } else {
        emit('change', { key: props.field, value: option.hash })
      }
    }

    return { items, isMultiple, colCount, isPicked, pick, filterXSS }
  },
  render() {
    const { items, colCount, filterXSS } = this

    if (!items.length) {
      return <div class="image-choice-empty">请配置带图的选项</div>
    }

    return (
      <div
        class={['image-choice-wrapper', this.isMultiple ? 'is-multiple' : 'is-single']}
        style={`--image-choice-columns:${colCount}`}
      >
        {items.map((option) => (
          <div
            key={option.hash}
            class={['image-choice-item', this.isPicked(option) ? 'is-picked' : '']}
            onClick={() => this.pick(option)}
            role={this.isMultiple ? 'checkbox' : 'radio'}
            aria-checked={String(this.isPicked(option))}
          >
            <div class="image-choice-media">
              {option.image ? (
                <img src={option.image} alt="" />
              ) : (
                <span class="image-choice-placeholder">未设置图片</span>
              )}
              <span class="image-choice-mark"></span>
            </div>
            {this.showOptionText && option.text && (
              <div class="image-choice-text" v-html={filterXSS(option.text)}></div>
            )}
          </div>
        ))}
      </div>
    )
  }
})
