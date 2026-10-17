import {
  createRouter,
  createWebHistory
} from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { analysisTypeMap } from '@/management/config/analysisConfig'
import 'element-plus/theme-chalk/src/message.scss'
import 'element-plus/theme-chalk/src/message-box.scss'
import 'element-plus/theme-chalk/src/button.scss'
import 'element-plus/theme-chalk/src/overlay.scss'
import { useUserStore } from '@/management/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/survey'
  },
  {
    path: '/survey',
    name: 'survey',
    component: () => import('../pages/list/index.vue'),
    meta: {
      needLogin: true,
      title: '问卷列表'
    }
  },
  {
    path: '/download',
    name: 'download',
    component: () => import('../pages/download/DownloadPage.vue'),
    meta: {
      needLogin: true
    }
  },
  {
    path: '/survey/:id/edit',
    meta: {
      needLogin: true,
    },
    name: 'QuestionEdit',
    component: () => import('../pages/edit/index.vue'),
    children: [
      {
        path: '',
        meta: {
          needLogin: true
        },
        name: 'QuestionEditPage',
        component: () => import('../pages/edit/pages/edit/index.vue'),
        children: [
          {
            path: '',
            name: 'QuestionEditIndex',
            meta: {
              needLogin: true
            },
            component: () => import('../pages/edit/pages/edit/QuestionEditPage.vue')
          },
          {
            path: 'logic',
            name: 'LogicIndex',
            meta: {
              needLogin: true
            },
            component: () => import('../pages/edit/pages/edit/LogicIndex.vue'),
            props: (route) => ({ active: route.query.active })
          }
        ]
      },
      {
        path: 'setting',
        name: 'QuestionEditSetting',
        meta: {
          needLogin: true
        },
        component: () => import('../pages/edit/pages/setting/index.vue')
      },
      {
        path: 'skin',
        meta: {
          needLogin: true
        },
        component: () => import('../pages/edit/pages/skin/index.vue'),
        children: [
          {
            path: '',
            name: 'QuestionSkinSetting',
            meta: {
              needLogin: true
            },
            component: () => import('../pages/edit/pages/skin/ContentPage.vue')
          },
          {
            path: 'result',
            name: 'QuestionEditResultConfig',
            meta: {
              needLogin: true
            },
            component: () => import('../pages/edit/pages/skin/ResultPage.vue')
          }
        ]
      }
    ]
  },
  {
    path: '/survey/:id/analysis',
    name: 'analysisPage',
    redirect: {
      name: analysisTypeMap.dataTable
    },
    meta: {
      needLogin: true,
    },
    component: () => import('../pages/analysis/AnalysisPage.vue'),
    children: [
      {
        path: analysisTypeMap.dataTable,
        name: analysisTypeMap.dataTable,
        meta: {
          needLogin: true,
        },
        component: () => import('../pages/analysis/pages/DataTablePage.vue')
      },
      {
        path: analysisTypeMap.separateStatistics,
        name: analysisTypeMap.separateStatistics,
        meta: {
          needLogin: true,
        },
        component: () => import('../pages/analysis/pages/SeparateStatisticsPage.vue')
      },
      {
        path: analysisTypeMap.responseManage,
        name: analysisTypeMap.responseManage,
        meta: {
          needLogin: true,
        },
        component: () => import('../pages/analysis/pages/ResponseManagePage.vue')
      }
    ]
  },
  {
    path: '/survey/:id/screen',
    name: 'screenPage',
    meta: {
      needLogin: true,
    },
    component: () => import('../pages/screen/ScreenPage.vue')
  },
  {
    // 原来「投放」有 publish / channel 两个页面两个入口，内容还不同。
    // 现已合并到 channel 一个页面（含链接、投放列表、投放方式 + 实时预览）。
    path: '/survey/:id/publish',
    redirect: (to) => ({ name: 'channel', params: { id: to.params.id } })
  },
  {
    path: '/survey/:id/channel',
    name: 'channel',
    meta: {
      needLogin: true,
    },
    component: () => import('../pages/publish/ChannelPage.vue')
  },
  {
    path: '/create',
    name: 'create',
    meta: {
      needLogin: true,
      title: '创建问卷'
    },
    component: () => import('../pages/create/CreatePage.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/login/LoginPage.vue'),
    meta: {
      title: '登录'
    }
  }
]

const router = createRouter({
  history: createWebHistory('/management'),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  // 初始化用户信息
  if (!userStore?.initialized) {
    await userStore.init()
  }
  // 更新页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  if (to.meta.needLogin && !userStore?.hasLogin) {
    next({
      name: 'login',
      query: { redirect: encodeURIComponent(to.path) }
    })
    return
  }
  next()
})

export default router
