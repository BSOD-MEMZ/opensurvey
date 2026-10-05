import { computed, defineComponent, ref } from 'vue'
import { filterXSS } from '@/common/xss'
import './style.scss'

/**
 * 排序题
 * 提交值为按用户排定顺序排列的选项 hash 数组
 */
export default defineComponent({
  name: 'SortModule',
  props: {
    type: {
      type: String,
      default: 'sort'
    },
    field: {
      type: String,
      default: ''
    },
    value: {
      type: Array,
      default: () => []
    },
    options: {
      type: Array,
      default: () => []
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['change'],
  setup(props, { emit }) {
    const dragIndex = ref(-1)

    // 兼容选项被编辑后旧的排序值：已排序的优先，未出现的按原顺序补到后面
    const ordered = computed(() => {
      const opts = Array.isArray(props.options) ? props.options : []
      const hashes = opts.map((item) => item.hash)
      const picked = (Array.isArray(props.value) ? props.value : []).filter((hash) => hashes.includes(hash))
      const rest = hashes.filter((hash) => !picked.includes(hash))
      const finalOrder = [...picked, ...rest]
      return finalOrder.map((hash, index) => {
        const item = opts.find((opt) => opt.hash === hash) || {}
        return { ...item, order: index + 1 }
      })
    })

    const commit = (list) => {
      emit('change', {
        key: props.field,
        value: list.map((item) => item.hash)
      })
    }

    const move = (from, to) => {
      if (props.readonly) return
      const list = [...ordered.value]
      if (from < 0 || to < 0 || from >= list.length || to >= list.length || from === to) return
      const [moved] = list.splice(from, 1)
      list.splice(to, 0, moved)
      commit(list)
    }

    const onDragStart = (index, event) => {
      if (props.readonly) return
      dragIndex.value = index
      if (event?.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        // Firefox 需要设置数据才会触发拖拽
        event.dataTransfer.setData('text/plain', String(index))
      }
    }
    const onDragOver = (event) => {
      if (props.readonly) return
      event?.preventDefault()
    }
    const onDrop = (index, event) => {
      event?.preventDefault()
      if (dragIndex.value !== -1) {
        move(dragIndex.value, index)
      }
      dragIndex.value = -1
    }
    const onDragEnd = () => {
      dragIndex.value = -1
    }

    return { ordered, move, dragIndex, onDragStart, onDragOver, onDrop, onDragEnd, filterXSS }
  },
  render() {
    const { ordered, readonly, dragIndex, filterXSS } = this

    if (!ordered.length) {
      return <div class="sort-empty">请配置排序项</div>
    }

    return (
      <div class={['sort-wrapper', readonly ? 'is-readonly' : '']}>
        <ul class="sort-list">
          {ordered.map((item, index) => (
            <li
              key={item.hash}
              class={['sort-item', dragIndex === index ? 'is-dragging' : '']}
              draggable={readonly ? 'false' : 'true'}
              onDragstart={() => this.onDragStart(index)}
              onDragover={(event) => this.onDragOver(event)}
              onDrop={(event) => this.onDrop(index, event)}
              onDragend={this.onDragEnd}
            >
              <span class="sort-index">{index + 1}</span>
              <span class="sort-handle" title="拖动排序">
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span class="sort-text" v-html={filterXSS(item.text)}></span>
              {!readonly && (
                <span class="sort-actions">
                  <button
                    type="button"
                    class="sort-btn"
                    disabled={index === 0}
                    title="上移"
                    onClick={() => this.move(index, index - 1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    class="sort-btn"
                    disabled={index === ordered.length - 1}
                    title="下移"
                    onClick={() => this.move(index, index + 1)}
                  >
                    ↓
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
        <p class="sort-tip">拖动条目或点击箭头调整顺序</p>
      </div>
    )
  }
})
