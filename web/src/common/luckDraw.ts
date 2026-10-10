/**
 * 提交成功页「抽奖转盘」的公共逻辑 —— 编辑器与答题端共用一份，
 * 免得两边对"爆率怎么算"的理解不一致。
 */

export interface LuckPrize {
  /** 奖品名称，转盘上显示的文字 */
  name: string
  /** 图标：emoji / 单个文字 / 图片地址（/xxx.png 或 http(s)://） */
  icon?: string
  /** 爆率：相对权重，不必凑够 100，按总和归一化 */
  rate: number
}

export interface LuckDrawConf {
  enable: boolean
  /** 转盘上方的标题文案 */
  title?: string
  prizes: LuckPrize[]
}

/** 开启抽奖但还没配奖品时的兜底（让转盘是可用的，而不是空白） */
export const DEFAULT_LUCK_PRIZES: LuckPrize[] = [
  { name: '一等奖', icon: '🎁', rate: 5 },
  { name: '二等奖', icon: '🍰', rate: 15 },
  { name: '三等奖', icon: '🍬', rate: 30 },
  { name: '谢谢参与', icon: '🌱', rate: 50 }
]

export const createDefaultLuckDrawConf = (): LuckDrawConf => ({
  enable: false,
  title: '恭喜你完成问卷！转动转盘试试手气吧',
  prizes: DEFAULT_LUCK_PRIZES.map((item) => ({ ...item }))
})

/** 把各种脏数据揉成能用的奖品列表（名称兜底、权重非负） */
export function normalizePrizes(prizes: any): LuckPrize[] {
  if (!Array.isArray(prizes)) return []
  return prizes
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => ({
      name: String(item.name ?? '').trim() || `奖项${index + 1}`,
      icon: typeof item.icon === 'string' ? item.icon : '',
      rate: Math.max(0, Number(item.rate) || 0)
    }))
}

/** 图标是图片还是文字 */
export function isImageIcon(icon?: string): boolean {
  if (!icon) return false
  return /^(https?:)?\/\//i.test(icon) || icon.startsWith('/')
}

/** 各奖品的实际中奖概率（0~1），用于编辑器里给作者看 */
export function prizeProbabilities(prizes: LuckPrize[]): number[] {
  const list = normalizePrizes(prizes)
  const total = list.reduce((sum, item) => sum + item.rate, 0)
  if (total <= 0) return list.map(() => (list.length ? 1 / list.length : 0))
  return list.map((item) => item.rate / total)
}

/**
 * 按爆率摇一个奖品下标。
 * 权重全为 0（或没有奖品）时退化成等概率，不至于抽不出来。
 */
export function pickPrizeIndex(prizes: LuckPrize[], random: () => number = Math.random): number {
  const list = normalizePrizes(prizes)
  if (!list.length) return -1
  const total = list.reduce((sum, item) => sum + item.rate, 0)
  if (total <= 0) return Math.floor(random() * list.length) % list.length

  let cursor = random() * total
  for (let i = 0; i < list.length; i++) {
    cursor -= list[i].rate
    if (cursor < 0) return i
  }
  return list.length - 1
}

/** 「同一次作答只抽一次」在 localStorage 里的 key */
export const luckDrawStorageKey = (surveyPath: string) => `opensurvey:luckdraw:${surveyPath}`

export interface LuckDrawRecord {
  name: string
  icon?: string
  time: number
}

export function readLuckDrawRecord(surveyPath: string): LuckDrawRecord | null {
  if (!surveyPath || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(luckDrawStorageKey(surveyPath))
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data.name !== 'string') return null
    return data as LuckDrawRecord
  } catch (e) {
    return null
  }
}

export function saveLuckDrawRecord(surveyPath: string, record: LuckDrawRecord) {
  if (!surveyPath || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(luckDrawStorageKey(surveyPath), JSON.stringify(record))
  } catch (e) {
    /* 隐私模式下写不进去就算了，不影响抽奖本身 */
  }
}
