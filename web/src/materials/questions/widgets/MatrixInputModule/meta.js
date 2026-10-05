import basicConfig from '@materials/questions/common/config/basicConfig'

const defaultColumns = [
  { text: '工作日', hash: 'micol1' },
  { text: '周末', hash: 'micol2' }
]

const defaultRows = [
  { text: '上午', hash: 'mirow1' },
  { text: '下午', hash: 'mirow2' },
  { text: '晚上', hash: 'mirow3' }
]

const meta = {
  title: '矩阵填空',
  type: 'matrix-input',
  componentName: 'MatrixInputModule',
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
      defaultValue: '请按行列填写'
    },
    {
      name: 'type',
      propType: 'String',
      description: '这是用于描述题目类型',
      defaultValue: 'matrix-input'
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
      name: 'matrixPlaceholder',
      propType: String,
      description: '单元格提示文案',
      defaultValue: '请填写'
    }
  ],
  formConfig: [
    basicConfig,
    {
      name: 'matrixRowConfig',
      title: '矩阵行（纵向项目）',
      type: 'Customed',
      content: [
        {
          label: '行项目',
          type: 'RowsSetter',
          key: 'matrixRows',
          value: defaultRows,
          tip: '每一行是一个待填写的项目，列是填写维度'
        },
        {
          label: '提示文案',
          type: 'InputSetter',
          key: 'matrixPlaceholder',
          value: '请填写',
          placeholder: '请填写'
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
