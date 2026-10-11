// 用于记录“问卷断点续答”的数据
export const getSurveyData = (id: string): any => {
  try {
    return JSON.parse(localStorage.getItem(`${id}_questionData`) as string) || null
  } catch (e) {
    console.log(e)
  }

  return null
}
export const setSurveyData = (id: string, formData: any = {}) => {
  localStorage.setItem(`${id}_questionData`, JSON.stringify(formData))
}
export const clearSurveyData = (id: string) => localStorage.removeItem(`${id}_questionData`)

// 问卷是否提交过，用于“自动填充上次填写内容”
export const getSurveySubmit = (id: string): number => {
  try {
    return Number(JSON.parse(localStorage.getItem(`${id}_submit`) as string)) || 0
  } catch (e) {
    console.log(e)
  }

  return 0
}
export const setSurveySubmit = (id: string, value: number) => {
  localStorage.setItem(`${id}_submit`, JSON.stringify(value))
}
export const clearSurveySubmit = (id: string) => localStorage.removeItem(`${id}_submit`)

// 提交成功的标记。与 fillSubmitAnswer 无关：只要提交成功就记一笔，
// 用来实现「同一份问卷、同一个浏览器只能提交一次」（作者可在问卷设置里放开）
export const getSurveyAnswered = (id: string): boolean =>
  localStorage.getItem(`${id}_answered`) === '1'
export const setSurveyAnswered = (id: string) =>
  localStorage.setItem(`${id}_answered`, '1')
export const clearSurveyAnswered = (id: string) => localStorage.removeItem(`${id}_answered`)

// 作答者标识：本浏览器固定一个 uuid，提交时带给服务端做去重。
// 换浏览器/清缓存就会变，这是纯前端的「同一人」近似判定（和问卷星一样靠本地标记为主）。
const RESPONDENT_KEY = 'opensurvey_respondent_id'
export const getRespondentId = (): string => {
  try {
    let id = localStorage.getItem(RESPONDENT_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(RESPONDENT_KEY, id)
    }
    return id
  } catch (e) {
    return ''
  }
}
