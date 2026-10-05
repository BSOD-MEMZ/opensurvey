/**
 * @description 问卷题目类型
 * 与前端 web/src/common/typeEnum.ts 的 QUESTION_TYPE 保持一致
 */
export enum QUESTION_TYPE {
  /**
   * 单行输入框
   */
  TEXT = 'text',
  /**
   * 多行输入框
   */
  TEXTAREA = 'textarea',
  /**
   * 日期
   */
  DATE = 'date',
  /**
   * 时间
   */
  TIME = 'time',
  /**
   * 下拉选择
   */
  SELECT = 'select',
  /**
   * 文件 / 图片上传
   */
  UPLOAD = 'upload',
  /**
   * 多项填空
   */
  MULTI_FILL = 'multi-fill',
  /**
   * 单项选择
   */
  RADIO = 'radio',
  /**
   * 多项选择
   */
  CHECKBOX = 'checkbox',
  /**
   * 判断题
   */
  BINARY_CHOICE = 'binary-choice',
  /**
   * 评分
   */
  RADIO_STAR = 'radio-star',
  /**
   * nps评分
   */
  RADIO_NPS = 'radio-nps',
  /**
   * 投票
   */
  VOTE = 'vote',
  /**
   * 图片单选
   */
  IMAGE_RADIO = 'image-radio',
  /**
   * 图片多选
   */
  IMAGE_CHECKBOX = 'image-checkbox',
  /**
   * 比重题 / 分配题
   */
  PROPORTION = 'proportion',
  /**
   * 多级联动
   */
  CASCADER = 'cascader',
  /**
   * 矩阵单选
   */
  MATRIX_RADIO = 'matrix-radio',
  /**
   * 矩阵量表
   */
  MATRIX_SCALE = 'matrix-scale',
  /**
   * 矩阵多选
   */
  MATRIX_CHECKBOX = 'matrix-checkbox',
  /**
   * 矩阵填空
   */
  MATRIX_INPUT = 'matrix-input',
  /**
   * 排序
   */
  SORT = 'sort',
  /**
   * 滑块量表
   */
  SLIDER = 'slider',
  /**
   * 段落说明（不产生答案）
   */
  SECTION = 'section',
  /**
   * 计算题
   */
  CALCULATION = 'calculation',
}
