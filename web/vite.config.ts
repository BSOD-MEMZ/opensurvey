import { fileURLToPath, URL } from 'node:url'
import { defineConfig, normalizePath } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

import { createMpaPlugin, createPages } from 'vite-plugin-virtual-mpa'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const isProd = process.env.NODE_ENV === 'production'

const pages = createPages([
  {
    name: 'management',
    filename: isProd ? 'management.html' : 'src/management/index.html',
    template: 'src/management/index.html',
    entry: '/src/management/main.js'
  },
  {
    name: 'render',
    filename: isProd ? 'render.html' : 'src/render/index.html',
    template: 'src/render/index.html',
    entry: '/src/render/main.js'
  }
])
const mpaPlugin = createMpaPlugin({
  pages,
  verbose: true,
  rewrites: [
    {
      from: /render/,
      to: () => normalizePath('/src/render/index.html')
    },
    {
      from: /management\/preview/,
      to: () => normalizePath('/src/render/index.html')
    },
    {
      from: /\/|\/management\/.?/,
      to: () => normalizePath('/src/management/index.html')
    }
  ]
})

// https://vitejs.dev/config/
export default defineConfig({
  // 本地浏览器都是新版 Edge/Chrome，dev 转换不必降级到 es2020
  esbuild: {
    target: 'esnext'
  },
  optimizeDeps: {
    // ⚠️ 这里漏一个依赖的代价很大：懒加载路由页里才出现的包若不在预构建列表，
    // Vite 会在你**切到那个页面的瞬间**重新预构建并强制整页 reload。
    // 实测点「分题统计」触发过 2 次整页刷新（deps/_metadata.json 当场被重写），
    // 表现就是「操作到一半页面卡住、然后被弹回登录页」。
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axios',
      'lodash-es',
      'async-validator',
      'vuedraggable',
      'element-plus/es',
      'element-plus/es/components/*/style/index.mjs',
      '@element-plus/icons-vue',
      'element-plus/dist/locale/zh-cn.mjs',
      'element-plus/es/locale/lang/zh-cn',
      '@wangeditor/editor-for-vue',
      '@wangeditor/editor',
      'copy-to-clipboard',
      'qrcode',
      'moment',
      'moment/locale/zh-cn',
      'nanoid',
      'yup',
      'xss',
      'crypto-js',
      'crypto-js/sha256',
      'node-forge',
      // 图表：分题统计 / 数据大屏走子模块导入，只 include 'echarts' 挡不住运行时重优化
      'echarts',
      'echarts/core',
      'echarts/charts',
      'echarts/components',
      'echarts/renderers',
      '@logicflow/core',
      '@logicflow/extension'
    ],
    // dev 下依赖默认不压缩：实测列表页要下载 8.9MB 未压缩 JS，浏览器解析/执行全卡在这。
    // 预构建产物压缩后体积只剩零头（keepNames 保住函数名，不破坏 devtools 与依赖内部的 name 判断）。
    esbuildOptions: {
      minify: true,
      keepNames: true
    }
  },
  plugins: [
    vue(),
    vueJsx(),
    AutoImport({
      resolvers: [
        ElementPlusResolver(),
        // Auto import icon components
        IconsResolver({
          prefix: 'Icon'
        })
      ]
    }),
    Components({
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass'
        }),
        // Auto register icon components
        IconsResolver({
          enabledCollections: ['ep']
        })
      ]
    }),
    Icons({
      autoInstall: true
    }),
    mpaPlugin
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@management': fileURLToPath(new URL('./src/management', import.meta.url)),
      '@materials': fileURLToPath(new URL('./src/materials', import.meta.url)),
      '@render': fileURLToPath(new URL('./src/render', import.meta.url))
    }
  },
  appType: 'mpa',
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        additionalData: `@use "@/management/styles/element-variables.scss" as *;`
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    open: false, // 是否自动打开浏览器
    // 启动时就把主入口和被依赖最重的页面预热转换掉。
    // 不做这一步的话，dev 下首次进入问卷列表页要现转换 150+ 个模块
    // （实测注册成功后被卡住 18.8s 才跳页），预热后首次访问即热。
    warmup: {
      clientFiles: [
        // 壳 + 两个 MPA 入口
        './src/management/main.js',
        './src/render/main.js',
        // 最常用的一级页
        './src/management/pages/login/LoginPage.vue',
        './src/management/pages/list/index.vue',
        './src/management/pages/create/CreatePage.vue',
        // 编辑器（问卷编辑 / 逻辑编排 / 设置 / 皮肤）
        './src/management/pages/edit/index.vue',
        './src/management/pages/edit/pages/edit/QuestionEditPage.vue',
        './src/management/pages/edit/pages/edit/LogicIndex.vue',
        './src/management/pages/edit/pages/setting/index.vue',
        './src/management/pages/edit/pages/skin/ContentPage.vue',
        // 分析：数据表 / 分题统计 / 答卷管理（分题统计要现场加载 echarts，最值得预热）
        './src/management/pages/analysis/AnalysisPage.vue',
        './src/management/pages/analysis/pages/DataTablePage.vue',
        './src/management/pages/analysis/pages/SeparateStatisticsPage.vue',
        './src/management/pages/analysis/pages/ResponseManagePage.vue',
        './src/management/pages/screen/ScreenPage.vue'
      ]
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      },
      '/exportfile': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      },
      // 静态文件的默认存储文件夹
      '/userUpload': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: '[ext]/[name]-[hash].[ext]',
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        manualChunks(id) {
          // 建议根据项目生产实际情况进行优化，部分可走cdn或进行小资源包合并
          if (id.includes('element-plus')) {
            return 'element-plus'
          }
          if (id.includes('wangeditor')) {
            return 'wangeditor'
          }
          if (id.includes('node-forg')) {
            return 'node-forg'
          }
          if (id.includes('echarts')) {
            return 'echarts'
          }

          if (id.includes('node_modules')) {
            return 'packages'
          }
        }
      }
    }
  }
})
