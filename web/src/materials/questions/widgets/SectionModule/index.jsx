import { defineComponent } from 'vue'
import { filterXSS } from '@/common/xss'
import './style.scss'

/**
 * 段落说明（说明题）
 * 只展示富文本内容，不产生答案，也不参与校验
 */
export default defineComponent({
  name: 'SectionModule',
  props: {
    type: {
      type: String,
      default: 'section'
    },
    field: {
      type: String,
      default: ''
    },
    desc: {
      type: String,
      default: ''
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  render() {
    const html = filterXSS(this.desc || '')

    return (
      <div class="section-wrapper">
        {html ? (
          <div class="section-desc" v-html={html}></div>
        ) : (
          <div class="section-empty">在右侧「说明内容」里填写要展示的文字</div>
        )}
      </div>
    )
  }
})
