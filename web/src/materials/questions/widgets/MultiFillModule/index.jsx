import { computed, defineComponent } from 'vue'
import { filterXSS } from '@/common/xss'
import './style.scss'

/**
 * 多项填空（一题多空）
 * 提交值为 { 空hash: 填写内容 }
 */
export default defineComponent({
  name: 'MultiFillModule',
  props: {
    type: {
      type: String,
      default: 'multi-fill'
    },
    field: {
      type: String,
      default: ''
    },
    value: {
      type: Object,
      default: () => ({})
    },
    fillBlanks: {
      type: Array,
      default: () => []
    },
    layout: {
      type: String,
      default: 'vertical'
    },
    blankPlaceholder: {
      type: String,
      default: '请填写'
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['blur', 'focus', 'change'],
  setup(props, { emit }) {
    const blanks = computed(() => (Array.isArray(props.fillBlanks) ? props.fillBlanks : []))

    const current = computed(() => {
      const v = props.value
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
    })

    const onInput = (blank, event) => {
      if (props.readonly) return
      emit('change', {
        key: props.field,
        value: {
          ...current.value,
          [blank.hash]: event.target.value
        }
      })
    }

    return { blanks, current, onInput, filterXSS }
  },
  render() {
    const { blanks, current, filterXSS } = this

    if (!blanks.length) {
      return <div class="multi-fill-empty">请配置填空项</div>
    }

    return (
      <div class={['multi-fill-wrapper', this.layout === 'horizontal' ? 'is-horizontal' : '']}>
        {blanks.map((blank) => (
          <div class="multi-fill-item" key={blank.hash}>
            <span class="multi-fill-label" v-html={filterXSS(blank.text)}></span>
            <input
              class="multi-fill-input"
              type="text"
              disabled={this.readonly}
              value={current[blank.hash] || ''}
              placeholder={this.blankPlaceholder || '请填写'}
              onBlur={() => this.$emit('blur')}
              onFocus={() => this.$emit('focus')}
              onInput={(event) => this.onInput(blank, event)}
            />
          </div>
        ))}
      </div>
    )
  }
})
