export default {
  Success: [
    {
      label: '提示文案',
      type: 'RichText',
      key: 'msgContent.msg_200',
      placeholder: '提交成功',
      value: '提交成功',
      labelStyle: {
        'font-weight': 'bold'
      }
    },
    // 以下两组都挂在 submitConf 下（见 resultModule/SetterPanel 的 key 前缀）
    {
      label: '抽奖转盘',
      type: 'LuckDrawSetter',
      key: 'luckDrawConf',
      value: {
        enable: false,
        title: '恭喜你完成问卷！转动转盘试试手气吧',
        prizes: [
          { name: '一等奖', icon: '🎁', rate: 5 },
          { name: '二等奖', icon: '🍰', rate: 15 },
          { name: '三等奖', icon: '🍬', rate: 30 },
          { name: '谢谢参与', icon: '🌱', rate: 50 }
        ]
      }
    },
    {
      // 分组标题用 title（label 是单个字段用的，分组上写 label 不会显示）
      title: '自动跳转',
      type: 'Customed',
      key: 'linkConf',
      content: [
        {
          label: '启用',
          labelStyle: { width: '120px' },
          type: 'CustomedSwitch',
          key: 'linkConf.enable',
          value: false
        },
        {
          label: '跳转链接',
          labelStyle: { width: '120px' },
          type: 'InputSetter',
          key: 'linkConf.url',
          placeholder: 'https://example.com/thanks',
          value: '',
          relyFunc: (moduleConfig) => Boolean(moduleConfig?.linkConf?.enable)
        },
        {
          label: '延迟（秒）',
          labelStyle: { width: '120px' },
          type: 'InputNumber',
          key: 'linkConf.delay',
          value: 5,
          min: 0,
          max: 120,
          relyFunc: (moduleConfig) => Boolean(moduleConfig?.linkConf?.enable)
        }
      ]
    }
  ],
  OverTime: [
    {
      label: '提示文案',
      type: 'RichText',
      key: 'msgContent.msg_9001',
      placeholder: '问卷已过期',
      value: '问卷已过期',
      labelStyle: {
        'font-weight': 'bold'
      }
    }
  ]
}
