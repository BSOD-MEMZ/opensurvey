import basicConfig from '@materials/questions/common/config/basicConfig'

const meta = {
  title: '日期',
  type: 'date',
  componentName: 'DateModule',
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
      defaultValue: '请选择日期'
    },
    {
      name: 'type',
      propType: 'String',
      description: '这是用于描述题目类型',
      defaultValue: 'date'
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
      name: 'dateRange',
      propType: Boolean,
      description: '是否为日期区间',
      defaultValue: false
    },
    {
      name: 'dateMin',
      propType: String,
      description: '最早可选日期',
      defaultValue: ''
    },
    {
      name: 'dateMax',
      propType: String,
      description: '最晚可选日期',
      defaultValue: ''
    }
  ],
  formConfig: [
    basicConfig,
    {
      name: 'dateConfig',
      title: '日期设置',
      type: 'Customed',
      content: [
        {
          label: '是否区间',
          type: 'RadioGroup',
          key: 'dateRange',
          value: false,
          options: [
            { label: '单个日期', value: false },
            { label: '日期区间', value: true }
          ]
        },
        {
          label: '最早可选',
          type: 'InputSetter',
          key: 'dateMin',
          value: '',
          placeholder: 'yyyy-MM-dd',
          tip: '留空表示不限制'
        },
        {
          label: '最晚可选',
          type: 'InputSetter',
          key: 'dateMax',
          value: '',
          placeholder: 'yyyy-MM-dd',
          tip: '留空表示不限制'
        }
      ]
    }
  ]
}

export default meta
