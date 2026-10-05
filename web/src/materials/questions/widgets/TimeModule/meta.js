import basicConfig from '@materials/questions/common/config/basicConfig'

const meta = {
  title: '时间',
  type: 'time',
  componentName: 'TimeModule',
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
      defaultValue: '请选择时间'
    },
    {
      name: 'type',
      propType: 'String',
      description: '这是用于描述题目类型',
      defaultValue: 'time'
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
      name: 'timeRange',
      propType: Boolean,
      description: '是否为时间区间',
      defaultValue: false
    },
    {
      name: 'timeStep',
      propType: Number,
      description: '时间粒度（秒）',
      defaultValue: 60
    }
  ],
  formConfig: [
    basicConfig,
    {
      name: 'timeConfig',
      title: '时间设置',
      type: 'Customed',
      content: [
        {
          label: '是否区间',
          type: 'RadioGroup',
          key: 'timeRange',
          value: false,
          options: [
            { label: '单个时间', value: false },
            { label: '时间区间', value: true }
          ]
        },
        {
          label: '时间粒度',
          type: 'RadioGroup',
          key: 'timeStep',
          value: 60,
          options: [
            { label: '时分', value: 60 },
            { label: '时分秒', value: 1 },
            { label: '半小时', value: 1800 }
          ]
        }
      ]
    }
  ]
}

export default meta
