import basicConfig from '@materials/questions/common/config/basicConfig'

const meta = {
  title: '计算题',
  type: 'calculation',
  componentName: 'CalculationModule',
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
      defaultValue: '计算结果'
    },
    {
      name: 'type',
      propType: 'String',
      description: '这是用于描述题目类型',
      defaultValue: 'calculation'
    },
    {
      name: 'isRequired',
      propType: Boolean,
      description: '计算题结果由公式得出，不需要必填校验',
      defaultValue: false
    },
    {
      name: 'showIndex',
      propType: Boolean,
      description: '显示序号',
      defaultValue: false
    },
    {
      name: 'showType',
      propType: Boolean,
      description: '显示类型',
      defaultValue: false
    },
    {
      name: 'showSpliter',
      propType: Boolean,
      description: '显示分割线',
      defaultValue: true
    },
    {
      name: 'calcFields',
      propType: Array,
      description: '参与计算的题目',
      defaultValue: []
    },
    {
      name: 'calcFormula',
      propType: String,
      description: '计算公式',
      defaultValue: ''
    },
    {
      name: 'calcPrecision',
      propType: Number,
      description: '结果保留小数位',
      defaultValue: 2
    },
    {
      name: 'calcUnit',
      propType: String,
      description: '结果单位',
      defaultValue: ''
    },
    {
      name: 'calcVisible',
      propType: Boolean,
      description: '是否把结果显示给答题人',
      defaultValue: true
    }
  ],
  formConfig: [
    basicConfig,
    {
      name: 'calcConfig',
      title: '计算设置',
      type: 'Customed',
      content: [
        {
          label: '参与计算的题目',
          type: 'CalcFieldsSetter',
          key: 'calcFields',
          value: []
        },
        {
          label: '计算公式',
          type: 'InputSetter',
          key: 'calcFormula',
          value: '',
          placeholder: '如 Q1 + Q2 * 0.5',
          tip: '支持 + - * / 与括号，Q1、Q2 对应上面勾选题目的顺序'
        },
        {
          label: '保留小数位',
          type: 'InputNumber',
          key: 'calcPrecision',
          value: 2,
          min: 0,
          contentClass: 'input-number-config'
        },
        {
          label: '结果单位',
          type: 'InputSetter',
          key: 'calcUnit',
          value: '',
          placeholder: '如 分 / 元'
        },
        {
          label: '结果展示',
          type: 'RadioGroup',
          key: 'calcVisible',
          value: true,
          options: [
            { label: '展示给答题人', value: true },
            { label: '不展示（只记录）', value: false }
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
