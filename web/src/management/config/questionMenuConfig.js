export const menuItems = {
  text: {
    type: 'text',
    snapshot: '/imgs/question-type-snapshot/text.svg',
    path: 'InputModule',
    icon: 'tixing-danhangshuru',
    title: '单行输入框'
  },
  textarea: {
    type: 'textarea',
    snapshot: '/imgs/question-type-snapshot/textarea.svg',
    path: 'TextareaModule',
    icon: 'tixing-duohangshuru',
    title: '多行输入框'
  },
  radio: {
    type: 'radio',
    snapshot: '/imgs/question-type-snapshot/radio.svg',
    icon: 'tixing-danxuan',
    path: 'RadioModule',
    title: '单项选择'
  },
  checkbox: {
    type: 'checkbox',
    path: 'CheckboxModule',
    snapshot: '/imgs/question-type-snapshot/checkbox.svg',
    icon: 'tixing-duoxuan',
    title: '多项选择'
  },
  'binary-choice': {
    type: 'binary-choice',
    snapshot: '/imgs/question-type-snapshot/binary-choice.svg',
    path: 'BinaryChoiceModule',
    icon: 'tixing-panduanti',
    title: '判断题'
  },
  'radio-star': {
    type: 'radio-star',
    snapshot: '/imgs/question-type-snapshot/radio-star.svg',
    path: 'StarModule',
    icon: 'tixing-pingfen',
    title: '评分'
  },
  'radio-nps': {
    type: 'radio-nps',
    path: 'NpsModule',
    snapshot: '/imgs/question-type-snapshot/radio-nps.svg',
    icon: 'NPSpingfen',
    title: 'nps评分'
  },
  vote: {
    type: 'vote',
    path: 'VoteModule',
    snapshot: '/imgs/question-type-snapshot/vote.svg',
    icon: 'tixing-toupiao',
    title: '投票'
  },
  cascader: {
    type: 'cascader',
    path: 'CascaderModule',
    snapshot: '/imgs/question-type-snapshot/cascader.svg',
    icon: 'cascader-select',
    title: '多级联动'
  },
  'matrix-radio': {
    type: 'matrix-radio',
    path: 'MatrixRadioModule',
    snapshot: '/imgs/question-type-snapshot/matrix-radio.svg',
    icon: 'tixing-juzhendanxuan',
    title: '矩阵单选'
  },
  'matrix-scale': {
    type: 'matrix-scale',
    path: 'MatrixScaleModule',
    snapshot: '/imgs/question-type-snapshot/matrix-scale.svg',
    icon: 'tixing-juzhenliangbiao',
    title: '矩阵量表'
  },
  sort: {
    type: 'sort',
    path: 'SortModule',
    snapshot: '/imgs/question-type-snapshot/sort.svg',
    icon: 'tixing-paixu',
    title: '排序'
  },
  slider: {
    type: 'slider',
    path: 'SliderModule',
    snapshot: '/imgs/question-type-snapshot/slider.svg',
    icon: 'tixing-huakuai',
    title: '滑块量表'
  }
}

const menuGroup = [
  {
    title: '输入类题型',
    questionList: ['text', 'textarea']
  },
  {
    title: '选择类题型',
    questionList: ['radio', 'checkbox', 'binary-choice', 'radio-star', 'radio-nps', 'vote', 'sort']
  },
  {
    title: '矩阵类题型',
    questionList: ['matrix-radio', 'matrix-scale']
  },
  {
    title: '高级题型',
    questionList: ['cascader', 'slider']
  }
]

const menu = menuGroup.map((group) => {
  group.questionList = group.questionList.map((question) => menuItems[question])
  return group
})

export const questionTypeList = Object.values(menuItems)

export default menu
