import basicConfig from '@materials/questions/common/config/basicConfig'

const defaultColumns = [
  { text: '非常满意', hash: 'mccol1' },
  { text: '满意', hash: 'mccol2' },
  { text: '一般', hash: 'mccol3' },
  { text: '不满意', hash: 'mccol4' }
]

const defaultRows = [
  { text: '整体体验', hash: 'mcrow1' },
  { text: '功能完整性', hash: 'mcrow2' },
  { text: '操作便捷性', hash: 'mcrow3' }
]

const meta = {
  title: '矩阵多选',
  type: 'matrix-checkbox',
  componentName: 'MatrixCheckboxModule',
  attrs: [
    {
      name: 'field',
      propType: 'String',
      description: '这是用于描述题目id',
      defaultValue: ''
    },
    {
      name: 'title',
      propType: 'String',
      description: '这是用于描述题目标题',
      defaultValue: '以下项目分别符合哪些描述？'
    },
    {
      name: 'type',
      propType: 'String',
      description: '这是用于描述题目类型',
      defaultValue: 'matrix-checkbox'
    },
    {
      name: 'isRequired',
      propType: Boolean,
      description: '是否必填',
      defaultValue: true
    },
    {
      name: 'showIndex',
      propType: Boolean,
      description: '显示序号',
      defaultValue: true
    },
    {
      name: 'showType',
      propType: Boolean,
      description: '显示类型',
      defaultValue: true
    },
    {
      name: 'showSpliter',
      propType: Boolean,
      description: '显示分割线',
      defaultValue: true
    },
    {
      name: 'options',
      propType: 'Array',
      description: '这是用于描述矩阵的列',
      defaultValue: defaultColumns
    },
    {
      name: 'matrixRows',
      propType: 'Array',
      description: '矩阵的行',
      defaultValue: defaultRows
    },
    {
      name: 'minNum',
      propType: [String, Number],
      description: '每行最少选几项',
      defaultValue: ''
    }
  ],
  formConfig: [
    basicConfig,
    {
      name: 'matrixRowConfig',
      title: '矩阵行（横向项目）',
      type: 'Customed',
      content: [
        {
          label: '行项目',
          type: 'RowsSetter',
          key: 'matrixRows',
          value: defaultRows,
          tip: '每一行是一个待评价的项目，用户对每行可勾选多个列'
        },
        {
          label: '每行最少选',
          type: 'InputNumber',
          key: 'minNum',
          value: '',
          min: 0,
          contentClass: 'input-number-config'
        }
      ]
    }
  ],
  editConfigure: {
    optionEdit: {
      show: true
    },
    optionEditBar: {
      show: true,
      configure: {
        showOthers: false,
        showAdvancedConfig: false
      }
    }
  }
}

export default meta
