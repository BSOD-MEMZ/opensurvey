import { defineComponent } from 'vue'
import MatrixRender from '../MatrixCommon/MatrixRender'
import metaConfig from './meta.js'

export const meta = metaConfig

/**
 * 矩阵单选
 * 列为自定义选项，每行单选一列；提交值 { [rowHash]: columnHash }
 */
export default defineComponent({
  name: 'MatrixRadioModule',
  inheritAttrs: false,
  render() {
    return <MatrixRender {...this.$attrs} />
  }
})
