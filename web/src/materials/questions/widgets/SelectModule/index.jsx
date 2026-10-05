import { computed, defineComponent } from 'vue'
import './style.scss'

/**
 * 下拉选择（单选）
 * 提交值为选中项的 hash，与单选题一致
 */
export default defineComponent({
  name: 'SelectModule',
  props: {
    type: {
      type: String,
      default: 'select'
    },
    field: {
      type: String,
      default: ''
    },
    value: {
      type: String,
      default: ''
    },
    options: {
      type: Array,
      default: () => []
    },
    placeholder: {
      type: String,
      default: '请选择'
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['blur', 'focus', 'change'],
  setup(props, { emit }) {
    const items = computed(() => (Array.isArray(props.options) ? props.options : []))

    const onChange = (event) => {
      if (props.readonly) return
      emit('change', { key: props.field, value: event.target.value })
    }

    return { items, onChange }
  },
  render() {
    const { items } = this

    return (
      <div class="select-wrapper">
        <select
          class="select-input"
          disabled={this.readonly}
          value={this.value}
          onBlur={() => this.$emit('blur')}
          onFocus={() => this.$emit('focus')}
          onChange={(event) => this.onChange(event)}
        >
          <option value="">{this.placeholder || '请选择'}</option>
          {items.map((item) => (
            <option key={item.hash} value={item.hash}>
              {item.text}
            </option>
          ))}
        </select>
      </div>
    )
  }
})
