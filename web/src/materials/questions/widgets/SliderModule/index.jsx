import { computed, defineComponent } from 'vue'
import './style.scss'

/**
 * 滑块量表
 * 提交值为数字；未作答时为 ''（便于"必填"校验生效）
 */
export default defineComponent({
  name: 'SliderModule',
  props: {
    type: {
      type: String,
      default: 'slider'
    },
    field: {
      type: String,
      default: ''
    },
    value: {
      type: [Number, String],
      default: ''
    },
    sliderMin: {
      type: [Number, String],
      default: 0
    },
    sliderMax: {
      type: [Number, String],
      default: 100
    },
    sliderStep: {
      type: [Number, String],
      default: 1
    },
    sliderMinLabel: {
      type: String,
      default: ''
    },
    sliderMaxLabel: {
      type: String,
      default: ''
    },
    showSliderValue: {
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
    const toNum = (v, fallback) => {
      const n = Number(v)
      return Number.isFinite(n) ? n : fallback
    }

    const min = computed(() => toNum(props.sliderMin, 0))
    const max = computed(() => {
      const m = toNum(props.sliderMax, 100)
      return m > min.value ? m : min.value + 1
    })
    const step = computed(() => {
      const s = toNum(props.sliderStep, 1)
      return s > 0 ? s : 1
    })

    const answered = computed(() => {
      const v = props.value
      return v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v))
    })

    // 未作答时滑块停在最小值，但不产生答案
    const position = computed(() => (answered.value ? Number(props.value) : min.value))

    const percent = computed(() => ((position.value - min.value) / (max.value - min.value)) * 100)

    const onInput = (event) => {
      if (props.readonly) return
      emit('change', { key: props.field, value: Number(event.target.value) })
    }

    return { min, max, step, answered, position, percent, onInput }
  },
  render() {
    const { min, max, step, answered, position, percent, readonly } = this

    return (
      <div class="slider-wrapper">
        <div class="slider-head">
          {this.showSliderValue && (
            <span class={['slider-value', answered ? 'is-answered' : '']}>
              {answered ? position : '未选择'}
            </span>
          )}
        </div>
        <input
          class="slider-input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={position}
          disabled={readonly}
          style={`--slider-percent:${percent}%`}
          onInput={(event) => this.onInput(event)}
        />
        <div class="slider-scale">
          <span>{this.sliderMinLabel || min}</span>
          <span>{this.sliderMaxLabel || max}</span>
        </div>
      </div>
    )
  }
})
