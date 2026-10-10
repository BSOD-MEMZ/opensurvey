import axios from 'axios'
import router from '@/management/router/index'
import { get as _get } from 'lodash-es'
import { useUserStore } from '../stores/user'

export const CODE_MAP = {
  SUCCESS: 200,
  ERROR: 500,
  NO_AUTH: 403,
  ERR_AUTH: 1001
}

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000
})

instance.interceptors.response.use(
  (response) => {
    if (response.status !== 200) {
      throw new Error('http请求出错')
    }
    const res = response.data
    if (res.code === CODE_MAP.NO_AUTH || res.code === CODE_MAP.ERR_AUTH) {
      // 必须连本地登录态一起清掉。
      // 只 router.replace 不清 token 的话，hasLogin 仍是 true，
      // 路由守卫会再次放行受保护页面 → 页面又发请求 → 又 1001 → 又被弹回登录页，
      // 表现就是"动不动跳登录页、来回弹"。
      try {
        useUserStore().logout()
      } catch (e) {
        /* store 还没就绪时忽略，下面的跳转仍然生效 */
      }
      if (router.currentRoute.value.name !== 'login') {
        router.replace({
          name: 'login'
        })
      }
      return res
    } else {
      return res
    }
  },
  (err) => {
    throw new Error(err)
  }
)

instance.interceptors.request.use((config) => {
  const userStore = useUserStore()
  const hasLogin = _get(userStore, 'hasLogin')
  const token = _get(userStore, 'userInfo.token')
  if (hasLogin && token) {
    if (!config.headers) {
      config.headers = {}
    }
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default instance
