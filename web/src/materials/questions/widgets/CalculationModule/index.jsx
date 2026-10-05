import { computed, defineComponent, inject, unref, watch } from 'vue'
import { evaluateFormula } from '@materials/questions/common/utils/calcFormula'
import './style.scss'

/**
 * 计算题
 * - 由「参与计算的题目」与公式算出结果，结果本身作为一个普通答案提交，
 *   因此数据表 / 导出 / 统计链路不需要任何额外处理
 * - 公式里 Q1、Q2… 依次对应 calcFields 的顺序
 * - 对受访者只读展示；calcVisible 为 false 时完全不展示（只存值）
 */
export default defineComponent({
  name: 'CalculationModule',
  props: {
    type: {
      type: String,
      default: 'calculation'
    },
    field: {
      type: String,
      default: ''
    },
    value: {
      type: [String, Number],
      default: ''
    },
    calcFields: {
      type: Array,
      default: () => []
    },
    calcFormula: {
      type: String,
      default: ''
    },
    calcPrecision: {
      type: [Number, String],
      default: 2
    },
    calcUnit: {
      type: String,
      default: ''
    },
    calcVisible: {
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
    const form = inject('Form', null)

    const variables = computed(() => {
      const model = form?.model ? unref(form.model) : {}
      const fields = Array.isArray(props.calcFields) ? props.calcFields : []
      return fields.reduce((acc, item, index) => {
        acc[`Q${index + 1}`] = Number(model?.[item.field]) || 0
        return acc
      }, {})
    })

    const result = computed(() => {
      if (!props.calcFormula) return ''
      let value
      try {
        value = evaluateFormula(props.calcFormula, variables.value)
      } catch (error) {
        return ''
      }
      if (!Number.isFinite(value)) return ''
      const precision = Number(props.calcPrecision)
      return Number.isFinite(precision) && precision >= 0 ? Number(value.toFixed(precision)) : value
    })

    // 结果变化时写回表单，作为普通答案提交
    watch(
      result,
      (next) => {
        const current = props.value === null || props.value === undefined ? '' : props.value
        if (String(current) !== String(next)) {
          emit('change', { key: props.field, value: next })
        }
      },
      { immediate: true }
    )

    return { result }
  },
  render() {
    if (!this.calcVisible) {
      return <div class="calc-wrapper is-hidden"></div>
    }

    const hasResult = this.result !== '' && this.result !== null && this.result !== undefined

    return (
      <div class="calc-wrapper">
        <div class="calc-result">
          <span class={['calc-value', hasResult ? 'is-ready' : '']}>
            {hasResult ? this.result : '待计算'}
          </span>
          {this.calcUnit && <span class="calc-unit">{this.calcUnit}</span>}
        </div>
        {!this.calcFormula && <p class="calc-tip">尚未配置计算公式</p>}
      </div>
    )
  }
})
