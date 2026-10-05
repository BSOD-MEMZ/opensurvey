import basicConfig from '@materials/questions/common/config/basicConfig'

const meta = {
  title: '文件上传',
  type: 'upload',
  componentName: 'UploadModule',
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
      defaultValue: '请上传文件'
    },
    {
      name: 'type',
      propType: 'String',
      description: '这是用于描述题目类型',
      defaultValue: 'upload'
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
      name: 'uploadType',
      propType: String,
      description: '上传类型：image / file',
      defaultValue: 'image'
    },
    {
      name: 'fileCount',
      propType: Number,
      description: '最多上传数量',
      defaultValue: 1
    },
    {
      name: 'fileMaxSize',
      propType: Number,
      description: '单个文件大小上限（MB）',
      defaultValue: 5
    },
    {
      name: 'fileAccept',
      propType: String,
      description: '允许的文件类型（accept 语法）',
      defaultValue: ''
    }
  ],
  formConfig: [
    basicConfig,
    {
      name: 'uploadConfig',
      title: '上传设置',
      type: 'Customed',
      content: [
        {
          label: '上传类型',
          type: 'RadioGroup',
          key: 'uploadType',
          value: 'image',
          options: [
            { label: '图片', value: 'image' },
            { label: '任意文件', value: 'file' }
          ]
        },
        {
          label: '最多数量',
          type: 'InputNumber',
          key: 'fileCount',
          value: 1,
          min: 1,
          contentClass: 'input-number-config'
        },
        {
          label: '大小上限(MB)',
          type: 'InputNumber',
          key: 'fileMaxSize',
          value: 5,
          min: 0,
          contentClass: 'input-number-config'
        },
        {
          label: '允许格式',
          type: 'InputSetter',
          key: 'fileAccept',
          value: '',
          placeholder: '如 image/* 或 .pdf,.docx',
          tip: '留空表示按上传类型取默认值'
        }
      ]
    }
  ]
}

export default meta
