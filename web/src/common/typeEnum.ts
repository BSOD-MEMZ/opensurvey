// 题型枚举
export enum QUESTION_TYPE {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  DATE = 'date',
  TIME = 'time',
  SELECT = 'select',
  UPLOAD = 'upload',
  MULTI_FILL = 'multi-fill',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  BINARY_CHOICE = 'binary-choice',
  RADIO_STAR = 'radio-star',
  RADIO_NPS = 'radio-nps',
  VOTE = 'vote',
  IMAGE_RADIO = 'image-radio',
  IMAGE_CHECKBOX = 'image-checkbox',
  PROPORTION = 'proportion',
  CASCADER = 'cascader',
  MATRIX_RADIO = 'matrix-radio',
  MATRIX_SCALE = 'matrix-scale',
  MATRIX_CHECKBOX = 'matrix-checkbox',
  MATRIX_INPUT = 'matrix-input',
  SORT = 'sort',
  SLIDER = 'slider',
  SECTION = 'section',
  CALCULATION = 'calculation',
}

// 题目类型标签映射对象
export const typeTagLabels: Record<QUESTION_TYPE, string> = {
  [QUESTION_TYPE.TEXT]: '单行输入框',
  [QUESTION_TYPE.TEXTAREA]: '多行输入框',
  [QUESTION_TYPE.DATE]: '日期',
  [QUESTION_TYPE.TIME]: '时间',
  [QUESTION_TYPE.SELECT]: '下拉选择',
  [QUESTION_TYPE.UPLOAD]: '文件上传',
  [QUESTION_TYPE.MULTI_FILL]: '多项填空',
  [QUESTION_TYPE.RADIO]: '单选',
  [QUESTION_TYPE.CHECKBOX]: '多选',
  [QUESTION_TYPE.BINARY_CHOICE]: '判断题',
  [QUESTION_TYPE.RADIO_STAR]: '评分',
  [QUESTION_TYPE.RADIO_NPS]: 'NPS评分',
  [QUESTION_TYPE.VOTE]: '投票',
  [QUESTION_TYPE.IMAGE_RADIO]: '图片单选',
  [QUESTION_TYPE.IMAGE_CHECKBOX]: '图片多选',
  [QUESTION_TYPE.PROPORTION]: '比重题',
  [QUESTION_TYPE.CASCADER]: '多级联动',
  [QUESTION_TYPE.MATRIX_RADIO]: '矩阵单选',
  [QUESTION_TYPE.MATRIX_SCALE]: '矩阵量表',
  [QUESTION_TYPE.MATRIX_CHECKBOX]: '矩阵多选',
  [QUESTION_TYPE.MATRIX_INPUT]: '矩阵填空',
  [QUESTION_TYPE.SORT]: '排序',
  [QUESTION_TYPE.SLIDER]: '滑块量表',
  [QUESTION_TYPE.SECTION]: '段落说明',
  [QUESTION_TYPE.CALCULATION]: '计算题',
}

// 纯文本输入类（必填校验走 trim 逻辑）
export const INPUT = [QUESTION_TYPE.TEXT, QUESTION_TYPE.TEXTAREA]

// 选择类题型分类
export const NORMAL_CHOICES = [QUESTION_TYPE.RADIO, QUESTION_TYPE.CHECKBOX]

// 选择类题型分类
export const CHOICES = [
  QUESTION_TYPE.RADIO,
  QUESTION_TYPE.CHECKBOX,
  QUESTION_TYPE.BINARY_CHOICE,
  QUESTION_TYPE.VOTE,
  QUESTION_TYPE.SELECT,
  QUESTION_TYPE.IMAGE_RADIO,
  QUESTION_TYPE.IMAGE_CHECKBOX
]

// 评分题题型分类
export const RATES = [QUESTION_TYPE.RADIO_STAR, QUESTION_TYPE.RADIO_NPS]

// 矩阵题型分类（行 × 列二维作答）
export const MATRIX_TYPES = [
  QUESTION_TYPE.MATRIX_RADIO,
  QUESTION_TYPE.MATRIX_SCALE,
  QUESTION_TYPE.MATRIX_CHECKBOX,
  QUESTION_TYPE.MATRIX_INPUT
]

// 提交值为对象的题型：通用 required 判定不出"空对象"，需要逐题单独校验
export const OBJECT_VALUE_TYPES = [
  ...MATRIX_TYPES,
  QUESTION_TYPE.MULTI_FILL,
  QUESTION_TYPE.PROPORTION
]

// 不产生答案的说明类题型
export const NON_ANSWER_TYPES = [QUESTION_TYPE.SECTION]
