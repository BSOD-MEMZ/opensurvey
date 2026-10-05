// 定义提交的数据结构：{ field1: '', field2: [], field1_hash1: '', }
import {
  QUESTION_TYPE,
  OBJECT_VALUE_TYPES,
  NON_ANSWER_TYPES
} from '@/common/typeEnum.ts'

export default function ({ dataConf }) {
  const dataList = dataConf.dataList
  const formValues = {}
  for (const item of dataList) {
    // 题目id
    const key = item.field
    const { extraOptions, options, type, rangeConfig, innerType } = item

    // 说明类题目不产生答案，不进 formValues
    // （QuestionWrapper 里会读 formValues[field].toString()，所以这里必须要么给值要么完全不给）
    if (NON_ANSWER_TYPES.includes(type)) {
      continue
    }

    let value = ''

    // 值为对象的题型（矩阵 / 多项填空 / 比重）：初始化成空对象
    if (OBJECT_VALUE_TYPES.includes(type)) {
      value = {}
    }

    // 排序题默认按题目里的原始顺序给出，用户拖动后再覆盖
    if (type === QUESTION_TYPE.SORT) {
      value = (Array.isArray(options) ? options : []).map((option) => option.hash)
    }

    // 题型是多选，或者子题型是多选（innerType是用于投票）
    if (type === QUESTION_TYPE.CHECKBOX || innerType === QUESTION_TYPE.CHECKBOX) {
      value = value ? [value] : []
    }

    // 图片多选也要初始化成数组
    if (type === QUESTION_TYPE.IMAGE_CHECKBOX) {
      value = Array.isArray(value) ? value : []
    }

    formValues[key] = value

    const allOptions = []
    // 有固定选项
    if (Array.isArray(extraOptions)) {
      allOptions.push(...extraOptions)
    }
    // 有选项
    if (Array.isArray(options)) {
      allOptions.push(...options)
    }
    // 对所有选项遍历
    for (const optionItem of allOptions) {
      if (optionItem.others) {
        // 开启了更多输入框，生成更多输入框的key
        const opKey = `${key}_${optionItem.hash}`
        formValues[opKey] = ''
      }
    }

    // 星级评分开启了更多输入框
    if (rangeConfig && Object.keys(rangeConfig).length > 0) {
      for (const rkey of Object.keys(rangeConfig)) {
        if (rangeConfig[rkey].isShowInput) {
          const rangeKey = `${key}_${rkey}`
          formValues[rangeKey] = ''
        }
      }
    }
  }
  return {
    formValues
  }
}
