import basicConfig from '@materials/questions/common/config/basicConfig'

const defaultBlanks = [
  { text: '姓名', hash: 'blank1' },
  { text: '联系电话', hash: 'blank2' },
  { text: '所在单位', hash: 'blank3' }
]

const meta = {
  title: '多项填空',
  type: 'multi-fill',
  componentName: 'MultiFillModule',
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
      defaultValue: '请填写以下信息'
    },
    {
      name: 'type',
      propType: 'String',
      description: '这是用于描述题目类型',
      defaultValue: 'multi-fill'
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
      name: 'fillBlanks',
      propType: 'Array',
      description: '填空项',
      defaultValue: defaultBlanks
    },
    {
      name: 'layout',
      propType: String,
      description: '排列方式',
      defaultValue: 'vertical'
    },
    {
      name: 'blankPlaceholder',
      propType: String,
      description: '每个空的提示文案',
      defaultValue: '请填写'
    }
  ],
  formConfig: [
    basicConfig,
    {
      name: 'blankConfig',
      title: '填空项',
      type: 'Customed',
      content: [
        {
          label: '填空项',
          type: 'RowsSetter',
          key: 'fillBlanks',
          value: defaultBlanks,
          tip: '每行一个填空项，行文本即该项的标签'
        },
        {
          label: '排列方式',
          type: 'RadioGroup',
          key: 'layout',
          value: 'vertical',
          options: [
            { label: '竖排', value: 'vertical' },
            { label: '横排', value: 'horizontal' }
          ]
        },
        {
          label: '提示文案',
          type: 'InputSetter',
          key: 'blankPlaceholder',
          value: '请填写',
          placeholder: '请填写'
        }
      ]
    }
  ]
}

export default meta
