import { computed, defineComponent } from 'vue'
import { filterXSS } from '@/common/xss'
import '../MatrixCommon/style.scss'

/**
 * 矩阵填空：每行的每个单元格都是一个填空
 * 提交值形如 { 行hash: { 列hash: 内容 } }
 */
export default defineComponent({
  name: 'MatrixInputModule',
  props: {
    type: {
      type: String,
      default: 'matrix-input'
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
    matrixPlaceholder: {
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
    const columns = computed(() => (Array.isArray(props.options) ? props.options : []))
    const rows = computed(() => (Array.isArray(props.matrixRows) ? props.matrixRows : []))

    const current = computed(() => {
      const v = props.value
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
    })

    const valueOf = (row, col) => {
      const rowValue = current.value[row.hash]
      if (!rowValue || typeof rowValue !== 'object') return ''
      return rowValue[col.hash] ?? ''
    }

    const onInput = (row, col, event) => {
      if (props.readonly) return
      emit('change', {
        key: props.field,
        value: {
          ...current.value,
          [row.hash]: {
            ...(current.value[row.hash] || {}),
            [col.hash]: event.target.value
          }
        }
      })
    }

    return { columns, rows, valueOf, onInput, filterXSS }
  },
  render() {
    const { rows, columns, filterXSS } = this

    if (!rows.length) {
      return <div class="matrix-empty">请配置矩阵的行（每行一个项目）</div>
    }
    if (!columns.length) {
      return <div class="matrix-empty">请配置矩阵的列</div>
    }

    return (
      <div class="matrix-wrapper">
        <div class="matrix-scroll">
          <table class="matrix-table">
            <thead>
              <tr>
                <th class="matrix-corner"></th>
                {columns.map((col) => (
                  <th key={col.hash} class="matrix-col-head">
                    <span v-html={filterXSS(col.text)}></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.hash}>
                  <td class="matrix-row-title">
                    <span v-html={filterXSS(row.text)}></span>
                  </td>
                  {columns.map((col) => (
                    <td key={col.hash} class="matrix-cell is-input">
                      <input
                        class="matrix-cell-input"
                        type="text"
                        disabled={this.readonly}
                        value={this.valueOf(row, col)}
                        placeholder={this.matrixPlaceholder || '请填写'}
                        onBlur={() => this.$emit('blur')}
                        onFocus={() => this.$emit('focus')}
                        onInput={(event) => this.onInput(row, col, event)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
})
