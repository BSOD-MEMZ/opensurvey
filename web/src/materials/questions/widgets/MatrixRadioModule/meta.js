import basicConfig from '@materials/questions/common/config/basicConfig'

const defaultColumns = [
  { text: '非常满意', hash: 'mcol1' },
  { text: '满意', hash: 'mcol2' },
  { text: '一般', hash: 'mcol3' },
  { text: '不满意', hash: 'mcol4' }
]

const defaultRows = [
  { text: '整体体验', hash: 'mrow1' },
  { text: '功能完整性', hash: 'mrow2' },
  { text: '操作便捷性', hash: 'mrow3' }
]

const meta = {
  title: '矩阵单选',
  type: 'matrix-radio',
  componentName: 'MatrixRadioModule',
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
      defaultValue: '标题一'
    },
    {
      name: 'type',
      propType: 'String',
      description: '这是用于描述题目类型',
      defaultValue: 'matrix-radio'
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
      name: 'layout',
      propType: String,
      description: '排列方式',
      defaultValue: 'vertical'
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
          tip: '每一行是一个待评价的项目，用户对每行各选一列'
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
