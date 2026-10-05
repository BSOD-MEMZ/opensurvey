import basicConfig from '@materials/questions/common/config/basicConfig'

const defaultOptions = [
  {
    text: '选项1',
    others: false,
    mustOthers: false,
    othersKey: '',
    placeholderDesc: '',
    hash: '115101'
  },
  {
    text: '选项2',
    others: false,
    mustOthers: false,
    othersKey: '',
    placeholderDesc: '',
    hash: '115102'
  },
  {
    text: '选项3',
    others: false,
    mustOthers: false,
    othersKey: '',
    placeholderDesc: '',
    hash: '115103'
  }
]

const meta = {
  title: '下拉选择',
  type: 'select',
  componentName: 'SelectModule',
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
      defaultValue: '请选择'
    },
    {
      name: 'type',
      propType: 'String',
      description: '这是用于描述题目类型',
      defaultValue: 'select'
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
      propType: Array,
      description: '这是用于描述选项',
      defaultValue: defaultOptions
    },
    {
      name: 'placeholder',
      propType: String,
      description: '未选择时的提示文案',
      defaultValue: '请选择'
    }
  ],
  formConfig: [
    basicConfig,
    {
      name: 'selectConfig',
      title: '下拉设置',
      type: 'Customed',
      content: [
        {
          label: '提示文案',
          type: 'InputSetter',
          key: 'placeholder',
          value: '请选择',
          placeholder: '请选择'
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
