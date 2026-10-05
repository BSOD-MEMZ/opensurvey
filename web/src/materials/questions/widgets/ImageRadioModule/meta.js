import basicConfig from '@materials/questions/common/config/basicConfig'

const defaultOptions = [
  { text: '选项1', image: '', others: false, mustOthers: false, othersKey: '', placeholderDesc: '', hash: 'imgr1' },
  { text: '选项2', image: '', others: false, mustOthers: false, othersKey: '', placeholderDesc: '', hash: 'imgr2' },
  { text: '选项3', image: '', others: false, mustOthers: false, othersKey: '', placeholderDesc: '', hash: 'imgr3' }
]

const meta = {
  title: '图片单选',
  type: 'image-radio',
  componentName: 'ImageRadioModule',
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
      defaultValue: '请选择（图片单选）'
    },
    {
      name: 'type',
      propType: 'String',
      description: '这是用于描述题目类型',
      defaultValue: 'image-radio'
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
      description: '这是用于描述选项（带图片）',
      defaultValue: defaultOptions
    },
    {
      name: 'columns',
      propType: Number,
      description: '每行显示几列',
      defaultValue: 3
    },
    {
      name: 'showOptionText',
      propType: Boolean,
      description: '是否显示选项文案',
      defaultValue: true
    }
  ],
  formConfig: [
    basicConfig,
    {
      name: 'imageOptionConfig',
      title: '图片选项',
      type: 'Customed',
      content: [
        {
          label: '选项',
          type: 'ImageOptionsSetter',
          key: 'options',
          value: defaultOptions
        },
        {
          label: '每行列数',
          type: 'RadioGroup',
          key: 'columns',
          value: 3,
          options: [
            { label: '2 列', value: 2 },
            { label: '3 列', value: 3 },
            { label: '4 列', value: 4 },
            { label: '5 列', value: 5 }
          ]
        },
        {
          label: '选项文案',
          type: 'RadioGroup',
          key: 'showOptionText',
          value: true,
          options: [
            { label: '显示', value: true },
            { label: '只显示图片', value: false }
          ]
        }
      ]
    }
  ],
  // 图片选项用右侧面板的 ImageOptionsSetter 编辑，画布里直接渲染真实控件
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
