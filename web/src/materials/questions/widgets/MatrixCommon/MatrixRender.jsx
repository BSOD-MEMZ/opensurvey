import { computed, defineComponent } from 'vue'
import { filterXSS } from '@/common/xss'
import './style.scss'

// 量表最大档位（与问卷星一致，1~10）
const MAX_SCALE = 10

/**
 * 矩阵题共享渲染组件
 * matrix-radio：列为自定义选项，每行单选一列
 * matrix-scale：列自动生成为 1~N 的数字刻度
 * 提交值形如 { [rowHash]: columnHash }
 */
export default defineComponent({
  name: 'MatrixRender',
  props: {
    type: {
      type: String,
      default: 'matrix-radio'
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
    matrixRows: {
      type: Array,
      default: () => []
    },
    scaleMax: {
      type: [Number, String],
      default: 5
    },
    scaleMinLabel: {
      type: String,
      default: ''
    },
    scaleMaxLabel: {
      type: String,
      default: ''
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['change'],
  setup(props, { emit }) {
    const isScale = computed(() => props.type === 'matrix-scale')

    const columns = computed(() => {
      if (isScale.value) {
        let max = Number(props.scaleMax) || 5
        if (!Number.isFinite(max)) {
          max = 5
        }
        max = Math.max(2, Math.min(MAX_SCALE, Math.floor(max)))
        return Array.from({ length: max }, (_, i) => ({
          text: String(i + 1),
          hash: `scale_${i + 1}`
        }))
      }
      return Array.isArray(props.options) ? props.options : []
    })

    const rows = computed(() => (Array.isArray(props.matrixRows) ? props.matrixRows : []))

    const current = computed(() => {
      const v = props.value
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
    })

    const isPicked = (row, col) => current.value[row.hash] === col.hash

    const pick = (row, col) => {
      if (props.readonly) return
      emit('change', {
        key: props.field,
        value: {
          ...current.value,
          [row.hash]: col.hash
        }
      })
    }

    const clearRow = (row) => {
      if (props.readonly) return
      const next = { ...current.value }
      delete next[row.hash]
      emit('change', { key: props.field, value: next })
    }

    return { isScale, columns, rows, current, isPicked, pick, clearRow, filterXSS }
  },
  render() {
    const { rows, columns, isScale, filterXSS } = this

    if (!rows.length) {
      return <div class="matrix-empty">请配置矩阵的行（每行一个项目）</div>
    }
    if (!columns.length) {
      return <div class="matrix-empty">请配置矩阵的列（作为评分档位）</div>
    }

    return (
      <div class="matrix-wrapper">
        <div class="matrix-scroll">
          <table class="matrix-table">
            <thead>
              <tr>
                <th class="matrix-corner"></th>
                {columns.map((col) => (
                  <th key={col.hash} class={['matrix-col-head', isScale ? 'is-scale' : '']}>
                    <span v-html={filterXSS(col.text)}></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.hash} class={this.current[row.hash] ? 'is-answered' : ''}>
                  <td class="matrix-row-title">
                    <span v-html={filterXSS(row.text)}></span>
                    {!this.readonly && this.current[row.hash] && (
                      <button
                        type="button"
                        class="matrix-clear"
                        title="清除本行"
                        onClick={() => this.clearRow(row)}
                      >
                        ×
                      </button>
                    )}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.hash}
                      class={['matrix-cell', this.isPicked(row, col) ? 'is-picked' : '']}
                      onClick={() => this.pick(row, col)}
                    >
                      <span class="matrix-radio" role="radio" aria-checked={String(this.isPicked(row, col))}></span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isScale && (this.scaleMinLabel || this.scaleMaxLabel) && (
          <div class="matrix-scale-labels">
            <span class="scale-min">{this.scaleMinLabel}</span>
            <span class="scale-max">{this.scaleMaxLabel}</span>
          </div>
        )}
      </div>
    )
  }
})
