import { defineComponent } from 'vue'
import MatrixRender from '../MatrixCommon/MatrixRender'
import metaConfig from './meta.js'

export const meta = metaConfig

/**
 * 矩阵量表
 * 列为自动生成的 1~N 数字刻度（N 可配），每行单选一档；提交值 { [rowHash]: 'scale_i' }
 */
export default defineComponent({
  name: 'MatrixScaleModule',
  inheritAttrs: false,
  render() {
    return <MatrixRender {...this.$attrs} />
  }
})
