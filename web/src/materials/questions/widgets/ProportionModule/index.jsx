import { computed, defineComponent } from 'vue'
import { filterXSS } from '@/common/xss'
import './style.scss'

/**
 * 比重题 / 分配题
 * 提交值为 { 选项hash: 数值 }，各项之和应等于 100
 */
export default defineComponent({
  name: 'ProportionModule',
  props: {
    type: {
      type: String,
      default: 'proportion'
    },
    field: {
      type: String,
      default: ''
    },
    value: {
      type: Object,
      default: () => ({})
    },
    options: {
      type: Array,
      default: () => []
    },
    total: {
      type: [Number, String],
      default: 100
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['change'],
  setup(props, { emit }) {
    const items = computed(() => (Array.isArray(props.options) ? props.options : []))

    const totalTarget = computed(() => {
      const n = Number(props.total)
      return Number.isFinite(n) && n > 0 ? n : 100
    })

    const current = computed(() => {
      const v = props.value
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
    })

    const sum = computed(() =>
      items.value.reduce((acc, item) => acc + (Number(current.value[item.hash]) || 0), 0)
    )

    const isBalanced = computed(() => sum.value === totalTarget.value)

    const percentOf = (item) => {
      if (!totalTarget.value) return 0
      return Math.min(100, ((Number(current.value[item.hash]) || 0) / totalTarget.value) * 100)
    }

    const onInput = (item, event) => {
      if (props.readonly) return
      const raw = event.target.value
      let num = raw === '' ? '' : Number(raw)
      if (num !== '' && (!Number.isFinite(num) || num < 0)) return
      if (num !== '' && num > totalTarget.value) num = totalTarget.value
      emit('change', {
        key: props.field,
        value: {
          ...current.value,
          [item.hash]: num === '' ? '' : num
        }
      })
    }

    return { items, current, sum, totalTarget, isBalanced, percentOf, onInput, filterXSS }
  },
  render() {
    const { items, current, sum, totalTarget, isBalanced, percentOf, filterXSS } = this

    if (!items.length) {
      return <div class="proportion-empty">请配置比重项</div>
    }

    return (
      <div class="proportion-wrapper">
        {items.map((item) => (
          <div class="proportion-item" key={item.hash}>
            <span class="proportion-label" v-html={filterXSS(item.text)}></span>
            <div class="proportion-bar">
              <span style={`width:${percentOf(item)}%`}></span>
            </div>
            <div class="proportion-input-box">
              <input
                class="proportion-input"
                type="number"
                min="0"
                max={totalTarget}
                disabled={this.readonly}
                value={current[item.hash] === '' || current[item.hash] === undefined ? '' : current[item.hash]}
                placeholder="0"
                onInput={(event) => this.onInput(item, event)}
              />
              <span class="proportion-unit">%</span>
            </div>
          </div>
        ))}

        <div class={['proportion-total', isBalanced ? 'is-balanced' : 'is-unbalanced']}>
          合计 <strong>{sum}</strong>% / {totalTarget}%
          {!isBalanced && <span class="proportion-hint">（各项之和需等于 {totalTarget}%）</span>}
        </div>
      </div>
    )
  }
})
