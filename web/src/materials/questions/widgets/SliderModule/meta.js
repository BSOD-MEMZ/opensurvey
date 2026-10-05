import basicConfig from '@materials/questions/common/config/basicConfig'

const meta = {
  title: '滑块量表',
  type: 'slider',
  componentName: 'SliderModule',
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
      defaultValue: 'slider'
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
      name: 'sliderMin',
      propType: Number,
      description: '最小值',
      defaultValue: 0
    },
    {
      name: 'sliderMax',
      propType: Number,
      description: '最大值',
      defaultValue: 100
    },
    {
      name: 'sliderStep',
      propType: Number,
      description: '步长',
      defaultValue: 1
    },
    {
      name: 'sliderMinLabel',
      propType: String,
      description: '最小值说明',
      defaultValue: '非常不满意'
    },
    {
      name: 'sliderMaxLabel',
      propType: String,
      description: '最大值说明',
      defaultValue: '非常满意'
    },
    {
      name: 'showSliderValue',
      propType: Boolean,
      description: '显示当前数值',
      defaultValue: true
    }
  ],
  formConfig: [
    basicConfig,
    {
      name: 'sliderConfig',
      title: '滑块设置',
      type: 'Customed',
      content: [
        {
          label: '最小值',
          type: 'InputNumber',
          key: 'sliderMin',
          value: 0,
          contentClass: 'input-number-config'
        },
        {
          label: '最大值',
          type: 'InputNumber',
          key: 'sliderMax',
          value: 100,
          contentClass: 'input-number-config'
        },
        {
          label: '步长',
          type: 'InputNumber',
          key: 'sliderStep',
          value: 1,
          min: 1,
          contentClass: 'input-number-config'
        },
        {
          label: '下限说明',
          type: 'InputSetter',
          key: 'sliderMinLabel',
          value: '非常不满意',
          placeholder: '例如：非常不满意'
        },
        {
          label: '上限说明',
          type: 'InputSetter',
          key: 'sliderMaxLabel',
          value: '非常满意',
          placeholder: '例如：非常满意'
        },
        {
          label: '显示当前数值',
          type: 'RadioGroup',
          key: 'showSliderValue',
          value: true,
          options: [
            { label: '显示', value: true },
            { label: '隐藏', value: false }
          ]
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
