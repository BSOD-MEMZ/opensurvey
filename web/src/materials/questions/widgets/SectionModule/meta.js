import basicConfig from '@materials/questions/common/config/basicConfig'

const meta = {
  title: '段落说明',
  type: 'section',
  componentName: 'SectionModule',
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
      description: '这是用于描述说明标题',
      defaultValue: '说明'
    },
    {
      name: 'type',
      propType: 'String',
      description: '这是用于描述题目类型',
      defaultValue: 'section'
    },
    // 说明题不产生答案，isRequired 只是为了让 schema 结构与其它题一致
    {
      name: 'isRequired',
      propType: Boolean,
      description: '说明题恒为否（不参与校验）',
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
      defaultValue: false
    },
    {
      name: 'desc',
      propType: String,
      description: '说明正文（富文本）',
      defaultValue: '<p>这里可以放一段说明文字，用来分段或交代背景。</p>'
    }
  ],
  formConfig: [
    {
      name: 'displayConfig',
      title: '显示设置',
      type: 'Customed',
      content: [
        {
          label: '显示序号',
          type: 'RadioGroup',
          key: 'showIndex',
          value: false,
          options: [
            { label: '显示', value: true },
            { label: '隐藏', value: false }
          ]
        },
        {
          label: '显示分割线',
          type: 'RadioGroup',
          key: 'showSpliter',
          value: false,
          options: [
            { label: '显示', value: true },
            { label: '隐藏', value: false }
          ]
        }
      ]
    },
    {
      name: 'descConfig',
      title: '说明内容',
      type: 'Customed',
      content: [
        {
          label: '正文',
          type: 'RichText',
          key: 'desc',
          value: ''
        }
      ]
    }
  ],
  // 说明题没有输入控件，画布里直接渲染自身
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
