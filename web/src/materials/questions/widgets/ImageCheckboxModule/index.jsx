import { defineComponent } from 'vue'

import ImageChoiceRender from '../ImageCommon/ImageChoiceRender'
import myMeta from './meta'

export const meta = myMeta

/**
 * 图片多选：薄包装，复用 ImageCommon/ImageChoiceRender
 */
export default defineComponent({
  name: 'ImageCheckboxModule',
  inheritAttrs: false,
  props: {
    field: {
      type: String,
      default: ''
    },
    value: {
      type: [String, Array],
      default: () => []
    },
    options: {
      type: Array,
      default: () => []
    },
    columns: {
      type: [Number, String],
      default: 3
    },
    showOptionText: {
      type: Boolean,
      default: true
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  emits: ['change'],
  render() {
    return (
      <ImageChoiceRender
        type="image-checkbox"
        field={this.field}
        value={this.value}
        options={this.options}
        columns={this.columns}
        showOptionText={this.showOptionText}
        readonly={this.readonly}
        onChange={(data) => this.$emit('change', data)}
      />
    )
  }
})
