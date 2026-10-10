// 问卷配置内容定义

export interface TitleConfig {
  mainTitle: string;
  subTitle: string;
}

export interface BannerConfig {
  bgImage: string;
  videoLink: string;
  postImg: string;
}

// 问卷头部内容：标题和头图
export interface BannerConf {
  titleConfig: TitleConfig;
  bannerConfig: BannerConfig;
}

export interface NPS {
  leftText: string;
  rightText: string;
}

export interface CascaderItem {
  hash: string;
  text: string;
  children?: CascaderItem[];
}

export interface CascaderDate {
  placeholder: Array<{
    hash: string;
    text: string;
  }>;
  children: Array<CascaderItem>;
}

export interface TextRange {
  min: {
    placeholder: string;
    value: number;
  };
  max: {
    placeholder: string;
    value: number;
  };
}

export interface DataItem {
  isRequired: boolean;
  showIndex: boolean;
  showType: boolean;
  showSpliter: boolean;
  type: string;
  valid?: string;
  field: string;
  title: string;
  placeholder: string;
  randomSort?: boolean;
  checked: boolean;
  minNum: string;
  maxNum: string;
  star: number;
  nps?: NPS;
  placeholderDesc: string;
  textRange?: TextRange;
  numberRange?: TextRange;
  options?: Option[];
  // 矩阵题的行（matrix-radio / matrix-scale / matrix-checkbox / matrix-input）
  matrixRows?: Array<{ text: string; hash: string }>;
  // 矩阵量表的格数
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  // 矩阵填空单元格的提示文案
  matrixPlaceholder?: string;
  // 多项填空的填空项
  fillBlanks?: Array<{ text: string; hash: string }>;
  blankPlaceholder?: string;
  // 日期 / 时间
  dateRange?: boolean;
  dateMin?: string;
  dateMax?: string;
  timeRange?: boolean;
  timeStep?: number;
  // 文件上传
  uploadType?: string;
  fileCount?: number;
  fileMaxSize?: number;
  fileAccept?: string;
  // 图片题
  columns?: number;
  showOptionText?: boolean;
  // 比重题
  total?: number;
  // 计算题
  calcFields?: Array<{ field: string; label: string }>;
  calcFormula?: string;
  calcPrecision?: number;
  calcUnit?: string;
  calcVisible?: boolean;
  // 段落说明的正文（富文本）
  desc?: string;
  importKey?: string;
  importData?: string;
  cOption?: string;
  cOptions?: string[];
  exclude?: boolean;
  rangeConfig?: any;
  starStyle?: string;
  innerType?: string;
  cascaderData: CascaderDate;
  quotaDisplay?: boolean;
  /** 考试模式：该题的标准答案（选项 hash 数组，或文本题的字符串） */
  examAnswer?: string | string[];
  /** 考试模式：该题分值，默认 1 */
  examScore?: number;
}

export interface Option {
  text: string;
  others: boolean;
  mustOthers?: boolean;
  othersKey?: string;
  placeholderDesc: string;
  hash: string;
  quota?: number;
}

export interface DataConf {
  dataList: DataItem[];
}

export interface ConfirmAgain {
  is_again: boolean;
  again_text: string;
}

export interface MsgContent {
  msg_200: string;
  msg_9001: string;
  msg_9002: string;
  msg_9003: string;
  msg_9004: string;
}

export interface SubmitConf {
  submitTitle: string;
  confirmAgain: ConfirmAgain;
  msgContent: MsgContent;
}

// 白名单类型
export enum WhitelistType {
  ALL = 'ALL',
  // 自定义
  CUSTOM = 'CUSTOM',
}

// 白名单用户类型
export enum MemberType {
  // 手机号
  MOBILE = 'MOBILE',
  // 邮箱
  EMAIL = 'EMAIL',
}

export interface BaseConf {
  beginTime: string;
  endTime: string;
  answerBegTime: string;
  answerEndTime: string;
  tLimit: number;
  language: string;
  // 访问密码开关
  passwordSwitch?: boolean;
  // 密码
  password?: string | null;
  // 白名单类型
  whitelistType?: WhitelistType;
  // 白名单用户类型
  memberType?: MemberType;
  // 白名单列表
  whitelist?: string[];
  // 提示语
  whitelistTip?: string;
  // 考试模式：开启后按每题的 examAnswer/examScore 自动判分
  examMode?: boolean;
  // 考试模式：及格分（用于成绩单提示，不影响判分）
  examPassScore?: number;
}

export interface SkinConf {
  skinColor: string;
  inputBgColor: string;
  backgroundConf: {
    color: string;
    type: string;
    image: string;
  };
  contentConf: {
    opacity: number;
  };
  themeConf: {
    color: string;
  };
}

export interface BottomConf {
  logoImage: string;
  logoImageWidth: string;
}

export interface SurveySchemaInterface {
  bannerConf: BannerConf;
  dataConf: DataConf;
  submitConf: SubmitConf;
  baseConf: BaseConf;
  skinConf: SkinConf;
  bottomConf: BottomConf;
}
