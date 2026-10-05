import { computed, defineComponent } from 'vue'
import './style.scss'

/**
 * 日期题
 * 单日期：提交 'YYYY-MM-DD'
 * 日期区间：提交 'YYYY-MM-DD ~ YYYY-MM-DD'
 *
 * 区间刻意存成一个字符串而不是 {start,end} 对象 —— 保持标量，
 * 数据表 / 导出 / 统计链路都不需要额外做值还原。
 */
export default defineComponent({
  name: 'DateModule',
  props: {
    type: {
      type: String,
      default: 'date'
    },
    field: {
      type: String,
      default: ''
    },
    value: {
      type: String,
      default: ''
    },
    dateRange: {
      type: Boolean,
      default: false
    },
    dateMin: {
      type: String,
      default: ''
    },
    dateMax: {
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
    const SEP = ' ~ '

    const parts = computed(() => {
      const v = typeof props.value === 'string' ? props.value : ''
      if (!props.dateRange) return [v, '']
      const index = v.indexOf(SEP)
      if (index < 0) return [v, '']
      return [v.slice(0, index), v.slice(index + SEP.length)]
    })

    const commit = (start, end) => {
      if (props.readonly) return
      const value = props.dateRange ? `${start}${SEP}${end}` : start
      emit('change', { key: props.field, value })
    }

    return { parts, commit, SEP }
  },
  render() {
    const [start, end] = this.parts
    const attrs = {
      type: 'date',
      disabled: this.readonly,
      min: this.dateMin || undefined,
      max: this.dateMax || undefined
    }

    return (
      <div class={['date-wrapper', this.dateRange ? 'is-range' : '']}>
        <input
          class="date-input"
          {...attrs}
          value={start}
          onBlur={() => this.$emit('blur')}
          onFocus={() => this.$emit('focus')}
          onChange={(event) => this.commit(event.target.value, end)}
        />
        {this.dateRange && <span class="date-separator">至</span>}
        {this.dateRange && (
          <input
            class="date-input"
            {...attrs}
            value={end}
            onBlur={() => this.$emit('blur')}
            onFocus={() => this.$emit('focus')}
            onChange={(event) => this.commit(start, event.target.value)}
          />
        )}
      </div>
    )
  }
})
