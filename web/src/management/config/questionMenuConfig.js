// 题型调色板配置
// snapshot 用于鼠标悬停时的预览图；图标由 QuestionTypeIcon 按 type 内联渲染
const snap = (type) => `/imgs/question-type-snapshot/${type}.svg`

export const menuItems = {
  text: {
    type: 'text',
    snapshot: snap('text'),
    path: 'InputModule',
    title: '单行输入框'
  },
  textarea: {
    type: 'textarea',
    snapshot: snap('textarea'),
    path: 'TextareaModule',
    title: '多行输入框'
  },
  date: {
    type: 'date',
    snapshot: snap('date'),
    path: 'DateModule',
    title: '日期'
  },
  time: {
    type: 'time',
    snapshot: snap('time'),
    path: 'TimeModule',
    title: '时间'
  },
  upload: {
    type: 'upload',
    snapshot: snap('upload'),
    path: 'UploadModule',
    title: '文件上传'
  },
  'multi-fill': {
    type: 'multi-fill',
    snapshot: snap('multi-fill'),
    path: 'MultiFillModule',
    title: '多项填空'
  },
  radio: {
    type: 'radio',
    snapshot: snap('radio'),
    path: 'RadioModule',
    title: '单项选择'
  },
  checkbox: {
    type: 'checkbox',
    snapshot: snap('checkbox'),
    path: 'CheckboxModule',
    title: '多项选择'
  },
  'binary-choice': {
    type: 'binary-choice',
    snapshot: snap('binary-choice'),
    path: 'BinaryChoiceModule',
    title: '判断题'
  },
  'radio-star': {
    type: 'radio-star',
    snapshot: snap('radio-star'),
    path: 'StarModule',
    title: '评分'
  },
  'radio-nps': {
    type: 'radio-nps',
    snapshot: snap('radio-nps'),
    path: 'NpsModule',
    title: 'nps评分'
  },
  vote: {
    type: 'vote',
    snapshot: snap('vote'),
    path: 'VoteModule',
    title: '投票'
  },
  select: {
    type: 'select',
    snapshot: snap('select'),
    path: 'SelectModule',
    title: '下拉选择'
  },
  'image-radio': {
    type: 'image-radio',
    snapshot: snap('image-radio'),
    path: 'ImageRadioModule',
    title: '图片单选'
  },
  'image-checkbox': {
    type: 'image-checkbox',
    snapshot: snap('image-checkbox'),
    path: 'ImageCheckboxModule',
    title: '图片多选'
  },
  'matrix-radio': {
    type: 'matrix-radio',
    path: 'MatrixRadioModule',
    snapshot: snap('matrix-radio'),
    title: '矩阵单选'
  },
  'matrix-scale': {
    type: 'matrix-scale',
    path: 'MatrixScaleModule',
    snapshot: snap('matrix-scale'),
    title: '矩阵量表'
  },
  'matrix-checkbox': {
    type: 'matrix-checkbox',
    path: 'MatrixCheckboxModule',
    snapshot: snap('matrix-checkbox'),
    title: '矩阵多选'
  },
  'matrix-input': {
    type: 'matrix-input',
    path: 'MatrixInputModule',
    snapshot: snap('matrix-input'),
    title: '矩阵填空'
  },
  proportion: {
    type: 'proportion',
    path: 'ProportionModule',
    snapshot: snap('proportion'),
    title: '比重题'
  },
  sort: {
    type: 'sort',
    path: 'SortModule',
    snapshot: snap('sort'),
    title: '排序'
  },
  slider: {
    type: 'slider',
    path: 'SliderModule',
    snapshot: snap('slider'),
    title: '滑块量表'
  },
  cascader: {
    type: 'cascader',
    path: 'CascaderModule',
    snapshot: snap('cascader'),
    title: '多级联动'
  },
  calculation: {
    type: 'calculation',
    path: 'CalculationModule',
    snapshot: snap('calculation'),
    title: '计算题'
  },
  section: {
    type: 'section',
    path: 'SectionModule',
    snapshot: snap('section'),
    title: '段落说明'
  }
}

const menuGroup = [
  {
    title: '输入类题型',
    questionList: ['text', 'textarea', 'date', 'time', 'upload', 'multi-fill']
  },
  {
    title: '选择类题型',
    questionList: [
      'radio',
      'checkbox',
      'binary-choice',
      'radio-star',
      'radio-nps',
      'vote',
      'select',
      'image-radio',
      'image-checkbox'
    ]
  },
  {
    title: '矩阵类题型',
    questionList: ['matrix-radio', 'matrix-scale', 'matrix-checkbox', 'matrix-input']
  },
  {
    title: '高级题型',
    questionList: ['proportion', 'sort', 'slider', 'cascader', 'calculation']
  },
  {
    title: '说明类题型',
    questionList: ['section']
  }
]

const menu = menuGroup.map((group) => {
  group.questionList = group.questionList.map((question) => menuItems[question])
  return group
})

export const questionTypeList = Object.values(menuItems)

export default menu
