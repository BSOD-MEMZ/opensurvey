import bannerConfig from './bannerConfig'
import logoConfig from './logoConfig'

export default [
  {
    name: '头图',
    key: 'bannerConf.bannerConfig',
    formConfigList: bannerConfig
  },
  {
    name: '背景',
    key: 'skinConf.backgroundConf',
    formConfigList: [
      {
        type: 'TabsSetter',
        key: 'type',
        options: [
          {
            label: '图片(<5M)',
            value: 'image'
          },
          {
            label: '颜色',
            value: 'color'
          }
        ]
      },
      {
        label: '背景图片',
        type: 'UploadSingleFile',
        accept: 'image/*',
        limitSize: 5, // 单位MB
        key: 'image',
        relyFunc: (data) => {
          return data.type === 'image'
        }
      },
      {
        label: '背景颜色',
        type: 'ColorPicker',
        key: 'color',
        relyFunc: (data) => {
          return data.type === 'color'
        }
      }
    ]
  },
  {
    name: '主题色',
    key: 'skinConf.themeConf',
    formConfigList: [
      {
        label: '全局应用',
        type: 'ColorPicker',
        key: 'color'
      }
    ]
  },
  {
    key: 'skinConf.contentConf',
    name: '内容区域',
    formConfigList: [
      {
        label: '内容透明度',
        type: 'SliderSetter',
        key: 'opacity'
      }
    ]
  },
  {
    name: '品牌logo',
    key: 'bottomConf',
    formConfigList: logoConfig
  },
  {
    name: '自定义 CSS',
    key: 'skinConf.customCssConf',
    formConfigList: [
      {
        label: 'CSS 代码',
        type: 'CodeSetter',
        key: 'code',
        rows: 12,
        hint: '直接作用于答题页，选择器 / 伪类 / 变量 / 动画都能用。为避免向第三方泄露受访者的 IP，@import 与外部 url() 会在渲染时被自动移除（本地相对路径与 data: 不受影响）。',
        placeholder: '/* 例：让题目卡片更圆润 */\n.question-wrapper {\n  border-radius: 24px;\n}'
      }
    ]
  }
]
