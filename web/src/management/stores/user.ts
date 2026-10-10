import { defineStore } from 'pinia'
import { ref } from 'vue'

import { getUserInfo, setUserInfo, clearUserInfo } from '@/management/utils/storage'

type IUserInfo = {
  username: string
  token: string
}

// 服务端 OPENSURVEY_JWT_EXPIRES_IN = 8h（见 server/.env*）。
// 前端本地登录态按同一个值判定，留 60s 裕量避免「本地还认、服务端已过期」的边界抖动。
const TOKEN_TTL_MS = 8 * 3600000 - 60000

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<IUserInfo | null>({
    username: '',
    token: ''
  })
  const hasLogin = ref(false)
  const loginTime = ref<number | null>(null)
  const initialized = ref(false)

  const init = () => {
    const localData = getUserInfo()
    try {
      const { userInfo: info, loginTime: time } = (localData || {}) as any
      // 只有确实存过 token 且登录态未过期，才算已登录。
      // 注意：getUserInfo() 在全新浏览器上返回的是 {}（真值），
      // 旧逻辑只判断 if (localData)，且 Date.now() - undefined 会算成 NaN，
      // 而 NaN > x 恒为 false，于是走 else 执行 login(undefined)，
      // 把 hasLogin 置为 true —— 未登录用户被当成已登录，
      // 导致先加载整个问卷列表页、等接口 401 后才被弹回登录页（首屏空白一大截）。
      if (info?.token && typeof time === 'number' && Date.now() - time <= TOKEN_TTL_MS) {
        login(info)
      } else {
        clearUserInfo()
      }
    } catch (error) {
      console.log(error)
      clearUserInfo()
    }
    initialized.value = true
  }
  const login = (data: IUserInfo) => {
    userInfo.value = data
    hasLogin.value = true
    loginTime.value = Date.now()
    setUserInfo({
      userInfo: data,
      // 必须取 .value！写 loginTime 会把 ref 对象本身序列化进 localStorage:
      // {"__v_isRef":true,"_rawValue":...,"_value":...}，
      // 于是 init() 里 `typeof time === 'number'` 判定为 false，
      // 每次整页加载（F5 / 直接开链接 / vite 整页刷新）都会走 clearUserInfo() 被踢回登录页。
      loginTime: loginTime.value
    })
  }
  const logout = () => {
    userInfo.value = null
    hasLogin.value = false
    clearUserInfo()
  }

  return { userInfo, hasLogin, loginTime, initialized, init, login, logout }
})
