import basicConfig from '@materials/questions/common/config/basicConfig'

const defaultRows = [
  { text: '产品功能', hash: 'msrow1' },
  { text: '页面设计', hash: 'msrow2' },
  { text: '客户服务', hash: 'msrow3' }
]

const meta = {
  title: '矩阵量表',
  type: 'matrix-scale',
  componentName: 'MatrixScaleModule',
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
      defaultValue: 'matrix-scale'
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
      name: 'matrixRows',
      propType: 'Array',
      description: '矩阵的行',
      defaultValue: defaultRows
    },
    {
      name: 'scaleMax',
      propType: Number,
      description: '量表格数',
      defaultValue: 5
    },
    {
      name: 'scaleMinLabel',
      propType: String,
      description: '低分端说明',
      defaultValue: '很不满意'
    },
    {
      name: 'scaleMaxLabel',
      propType: String,
      description: '高分端说明',
      defaultValue: '很满意'
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
          tip: '每一行是一个待评价的项目'
        }
      ]
    },
    {
      name: 'scaleConfig',
      title: '量表设置',
      type: 'Customed',
      content: [
        {
          label: '量表格数',
          type: 'InputNumber',
          key: 'scaleMax',
          value: 5,
          min: 2,
          max: 10,
          contentClass: 'input-number-config',
          tip: '生成 1~N 的数字刻度，最多 10 格'
        },
        {
          label: '低分端说明',
          type: 'InputSetter',
          key: 'scaleMinLabel',
          value: '很不满意',
          placeholder: '例如：很不满意'
        },
        {
          label: '高分端说明',
          type: 'InputSetter',
          key: 'scaleMaxLabel',
          value: '很满意',
          placeholder: '例如：很满意'
        }
      ]
    }
  ],
  editConfigure: {
    optionEdit: {
      show: false
    },
    optionEditBar: {
      show: false,
      configure: {
        showOthers: false,
        showAdvancedConfig: false
      }
    }
  }
}

export default meta
