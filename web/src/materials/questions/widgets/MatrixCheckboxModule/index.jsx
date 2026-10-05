import { computed, defineComponent } from 'vue'
import { filterXSS } from '@/common/xss'
import '../MatrixCommon/style.scss'

/**
 * 矩阵多选：每行可勾选多个列
 * 提交值形如 { 行hash: [列hash, ...] }
 */
export default defineComponent({
  name: 'MatrixCheckboxModule',
  props: {
    type: {
      type: String,
      default: 'matrix-checkbox'
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
    minNum: {
      type: [Number, String],
      default: ''
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

    const pickedOf = (row) => {
      const v = current.value[row.hash]
      return Array.isArray(v) ? v : []
    }

    const isPicked = (row, col) => pickedOf(row).includes(col.hash)

    const toggle = (row, col) => {
      if (props.readonly) return
      const prev = pickedOf(row)
      const next = prev.includes(col.hash)
        ? prev.filter((hash) => hash !== col.hash)
        : [...prev, col.hash]
      emit('change', {
        key: props.field,
        value: {
          ...current.value,
          [row.hash]: next
        }
      })
    }

    return { columns, rows, current, pickedOf, isPicked, toggle, filterXSS }
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
                <tr key={row.hash} class={this.pickedOf(row).length ? 'is-answered' : ''}>
                  <td class="matrix-row-title">
                    <span v-html={filterXSS(row.text)}></span>
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.hash}
                      class={['matrix-cell', this.isPicked(row, col) ? 'is-picked' : '']}
                      onClick={() => this.toggle(row, col)}
                    >
                      <span
                        class="matrix-checkbox"
                        role="checkbox"
                        aria-checked={String(this.isPicked(row, col))}
                      ></span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p class="matrix-tip">每行可勾选多个选项</p>
      </div>
    )
  }
})
