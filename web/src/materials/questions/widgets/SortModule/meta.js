import basicConfig from '@materials/questions/common/config/basicConfig'

const defaultOptions = [
  {
    text: '选项1',
    others: false,
    mustOthers: false,
    othersKey: '',
    placeholderDesc: '',
    hash: '115019'
  },
  {
    text: '选项2',
    others: false,
    mustOthers: false,
    othersKey: '',
    placeholderDesc: '',
    hash: '115020'
  },
  {
    text: '选项3',
    others: false,
    mustOthers: false,
    othersKey: '',
    placeholderDesc: '',
    hash: '115021'
  }
]

const meta = {
  title: '排序',
  type: 'sort',
  componentName: 'SortModule',
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
      defaultValue: 'sort'
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
      description: '这是用于描述待排序的选项',
      defaultValue: defaultOptions
    }
  ],
  formConfig: [basicConfig],
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
