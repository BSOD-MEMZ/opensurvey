import { computed, defineComponent } from 'vue'
import './style.scss'

/**
 * 时间题
 * 单时间：提交 'HH:mm'
 * 时间区间：提交 'HH:mm ~ HH:mm'（同日期题，保持标量）
 */
export default defineComponent({
  name: 'TimeModule',
  props: {
    type: {
      type: String,
      default: 'time'
    },
    field: {
      type: String,
      default: ''
    },
    value: {
      type: String,
      default: ''
    },
    timeRange: {
      type: Boolean,
      default: false
    },
    timeStep: {
      type: [Number, String],
      default: 60
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
      if (!props.timeRange) return [v, '']
      const index = v.indexOf(SEP)
      if (index < 0) return [v, '']
      return [v.slice(0, index), v.slice(index + SEP.length)]
    })

    const step = computed(() => {
      const n = Number(props.timeStep)
      return Number.isFinite(n) && n > 0 ? n : 60
    })

    const commit = (start, end) => {
      if (props.readonly) return
      const value = props.timeRange ? `${start}${SEP}${end}` : start
      emit('change', { key: props.field, value })
    }

    return { parts, commit, step }
  },
  render() {
    const [start, end] = this.parts
    const attrs = {
      type: 'time',
      step: this.step,
      disabled: this.readonly
    }

    return (
      <div class={['time-wrapper', this.timeRange ? 'is-range' : '']}>
        <input
          class="time-input"
          {...attrs}
          value={start}
          onBlur={() => this.$emit('blur')}
          onFocus={() => this.$emit('focus')}
          onChange={(event) => this.commit(event.target.value, end)}
        />
        {this.timeRange && <span class="time-separator">至</span>}
        {this.timeRange && (
          <input
            class="time-input"
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
