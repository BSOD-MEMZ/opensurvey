import { defineStore } from 'pinia'
import { ref } from 'vue'

import { getUserInfo, setUserInfo, clearUserInfo } from '@/management/utils/storage'

type IUserInfo = {
  username: string
  token: string
}

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
      if (info?.token && typeof time === 'number' && Date.now() - time <= 7 * 3600000) {
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
      loginTime: loginTime
    })
  }
  const logout = () => {
    userInfo.value = null
    hasLogin.value = false
    clearUserInfo()
  }

  return { userInfo, hasLogin, loginTime, initialized, init, login, logout }
})
