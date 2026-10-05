import basicConfig from '@materials/questions/common/config/basicConfig'

const defaultOptions = [
  { text: '产品性能', others: false, mustOthers: false, othersKey: '', placeholderDesc: '', hash: 'prp1' },
  { text: '价格', others: false, mustOthers: false, othersKey: '', placeholderDesc: '', hash: 'prp2' },
  { text: '售后服务', others: false, mustOthers: false, othersKey: '', placeholderDesc: '', hash: 'prp3' }
]

const meta = {
  title: '比重题',
  type: 'proportion',
  componentName: 'ProportionModule',
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
      defaultValue: '请为以下各项分配比重（合计 100%）'
    },
    {
      name: 'type',
      propType: 'String',
      description: '这是用于描述题目类型',
      defaultValue: 'proportion'
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
      name: 'total',
      propType: Number,
      description: '合计目标值',
      defaultValue: 100
    }
  ],
  formConfig: [
    basicConfig,
    {
      name: 'proportionConfig',
      title: '比重设置',
      type: 'Customed',
      content: [
        {
          label: '合计值',
          type: 'InputNumber',
          key: 'total',
          value: 100,
          min: 1,
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
