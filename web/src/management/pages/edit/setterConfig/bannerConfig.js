export default [
  {
    label: '顶部图片',
    type: 'ImageUploadSetter',
    key: 'bgImage',
    accept: 'image/*',
    limitSize: 5,
    hint: '建议 1125×420，过大会拖慢首屏',
    placeholder: '图片地址，或点右侧按钮上传',
    labelStyle: { width: '120px' }
  },
  {
    label: '顶部视频地址',
    type: 'InputSetter',
    key: 'videoLink',
    placeholder: '支持 mp4 视频直链',
    labelStyle: { width: '120px' }
  },
  {
    label: '视频海报',
    type: 'ImageUploadSetter',
    key: 'postImg',
    accept: 'image/*',
    limitSize: 5,
    hint: '视频加载前显示的封面',
    placeholder: '图片地址，或点右侧按钮上传',
    labelStyle: { width: '120px' }
  },
  {
    label: '图片支持点击',
    type: 'CustomedSwitch',
    labelStyle: { width: '120px' },
    key: 'bgImageAllowJump'
  },
  {
    label: '跳转链接',
    type: 'InputSetter',
    labelStyle: { width: '120px' },
    key: 'bgImageJumpLink',
    relyFunc: (data) => {
      return !!data?.bgImageAllowJump
    }
  }
]
