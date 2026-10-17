<template>
  <div
    class="login-page"
    :style="{
      background: `url('/imgs/create/background.webp') no-repeat bottom right`,
      'background-size': 'cover'
    }"
  >
    <div class="login-top">
      <img src="/imgs/Logo.webp" alt="logo" />
    </div>

    <div class="login-box">
      <div class="login-card">
        <!-- 登录 / 注册分模式，做成整行的分段控件，一眼看出自己处在哪一边。
             原来是两个按钮并排在同一表单上，点「注册」会立刻用当前账号密码注册。 -->
        <div class="mode-switch">
          <button
            type="button"
            class="mode-btn"
            :class="{ active: mode === 'login' }"
            @click="switchMode('login')"
          >
            登录
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ active: mode === 'register' }"
            @click="switchMode('register')"
          >
            注册
          </button>
        </div>

        <h2 class="card-title">{{ mode === 'login' ? '欢迎回来' : '创建新账号' }}</h2>
        <p class="card-sub">
          {{ mode === 'login' ? '登录后可管理你的问卷' : '注册后即可创建、投放并统计问卷' }}
        </p>

        <el-form
          :model="formData"
          :rules="rules"
          ref="formDataRef"
          label-position="top"
          class="login-form"
          @submit.prevent
        >
          <el-form-item label="账号" prop="name">
            <el-input
              v-model="formData.name"
              size="large"
              placeholder="请输入账号"
              @keyup.enter="submitForm()"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              type="password"
              show-password
              v-model="formData.password"
              size="large"
              placeholder="请输入密码"
              @keyup.enter="submitForm()"
            />
            <!-- 强度条紧贴密码框，不再单独占一个带空标签的表单项 -->
            <div v-if="passwordStrength" class="strength-box">
              <span
                class="strength"
                v-for="item in 3"
                :key="item"
                :style="{ backgroundColor: strengthColor[item - 1][passwordStrength] }"
              ></span>
              <span class="strength-text">强度 {{ strengthText }}（仅提示）</span>
            </div>
          </el-form-item>

          <el-form-item v-if="mode === 'register'" label="确认密码" prop="confirmPassword">
            <el-input
              type="password"
              v-model="formData.confirmPassword"
              size="large"
              placeholder="请再次输入密码"
              @keyup.enter="submitForm()"
            />
          </el-form-item>

          <el-button
            :loading="pending[mode]"
            type="primary"
            size="large"
            class="submit-btn"
            @click="submitForm()"
          >
            {{ mode === 'login' ? '登录' : '注册并登录' }}
          </el-button>

          <p class="switch-tip">
            <template v-if="mode === 'login'">
              还没有账号？<a @click="switchMode('register')">立即注册</a>
            </template>
            <template v-else>
              已有账号？<a @click="switchMode('login')">去登录</a>
            </template>
          </p>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/src/message.scss'

import { debounce } from 'lodash-es'

import { getPasswordStrength, login, register } from '@/management/api/auth'
import { CODE_MAP } from '@/management/api/base'
import { useUserStore } from '@/management/stores/user'

const route = useRoute()
const router = useRouter()

interface FormData {
  name: string
  password: string
  confirmPassword: string
}

interface Pending {
  login: boolean
  register: boolean
}

type Mode = 'login' | 'register'

const formData = reactive<FormData>({
  name: '',
  password: '',
  confirmPassword: ''
})

// 登录 / 注册分模式，避免同一表单上两个提交按钮并存造成的误操作
const mode = ref<Mode>('login')

const switchMode = (next: Mode) => {
  if (mode.value === next) return
  mode.value = next
  formData.confirmPassword = ''
  passwordStrength.value = undefined
  formDataRef.value?.clearValidate?.()
}

const strengthText = computed(
  () =>
    (({ Strong: '强', Medium: '中', Weak: '弱' }) as Record<string, string>)[
      passwordStrength.value || ''
    ] || ''
)

// 每个滑块不同强度的颜色，索引0对应第一个滑块
const strengthColor = reactive([
  {
    Strong: '#67C23A',
    Medium: '#ebb563',
    Weak: '#f78989'
  },
  {
    Strong: '#67C23A',
    Medium: '#ebb563',
    Weak: '#2a598a'
  },
  {
    Strong: '#67C23A',
    Medium: '#2a598a',
    Weak: '#2a598a'
  }
])

// 密码不再做任何限制：允许空密码、弱密码、任意字符。
// 密码强度只作为装饰性提示，单独防抖查询，不参与表单校验 ——
// 之前把它塞进表单校验器（debounce(..., 500)）里，导致每次点登录/注册
// 都要等 debounce 尾沿触发、还白打一次接口，实测点击到请求发出要多花 0.5~1s。
const passwordStrengthHandle = async (value: string) => {
  const res: any = await getPasswordStrength(value)
  if (res.code === CODE_MAP.SUCCESS) {
    passwordStrength.value = res.data
  }
}

watch(
  () => formData.password,
  debounce((value: string) => {
    if (typeof value === 'string' && value.length > 0) {
      passwordStrengthHandle(value)
    } else {
      passwordStrength.value = undefined
    }
  }, 500)
)

const rules = {
  name: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  // 注册模式才要求确认密码；登录模式下这条直接放行
  confirmPassword: [
    {
      validator: (_rule: any, value: string, callback: (e?: Error) => void) => {
        if (mode.value !== 'register') return callback()
        if (!value) return callback(new Error('请再次输入密码'))
        if (value !== formData.password) return callback(new Error('两次输入的密码不一致'))
        callback()
      },
      trigger: 'blur'
    }
  ]
}

const pending = reactive<Pending>({
  login: false,
  register: false
})

const formDataRef = ref<any>(null)
const passwordStrength = ref<'Strong' | 'Medium' | 'Weak'>()

const submitForm = () => {
  const type: Mode = mode.value
  formDataRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const submitTypes = {
          login,
          register
        }
        pending[type] = true
        // 已不需要验证码
        const res: any = await submitTypes[type]({
          username: formData.name,
          password: formData.password
        })
        pending[type] = false
        if (res.code !== CODE_MAP.SUCCESS) {
          ElMessage.error(res.errmsg)
          throw new Error('登录/注册失败' + res.errmsg)
        }
        const userStore = useUserStore()
        userStore.login({
          username: res.data.username,
          token: res.data.token
        })
        let redirect: any = {
          name: 'survey'
        }
        if (route.query.redirect) {
          redirect = decodeURIComponent(route.query.redirect as string)
        }
        router.replace(redirect)
      } catch (error) {
        pending[type] = false
      }
      return true
    } else {
      return false
    }
  })
}
</script>

<style lang="scss" scoped>
.login-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .login-top {
    flex: none;
    height: 56px;
    padding: 0 24px;
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.82);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(230, 233, 242, 0.9);

    img {
      width: 90px;
    }
  }

  .login-box {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    overflow: auto;
  }

  /* 一张对称留白的卡片：所有内容共用同一个 44px 左右边界，不再各排各的 */
  .login-card {
    width: 440px;
    max-width: 100%;
    padding: 36px 44px 32px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(68, 68, 102, 0.16);
  }

  .mode-switch {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: #f4f6fb;
    border-radius: 999px;
  }

  .mode-btn {
    flex: 1;
    height: 36px;
    font-size: 14px;
    color: #5d5d80;
    background: transparent;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    transition: color 0.16s ease, background-color 0.16s ease;

    &:hover {
      color: #2fa596;
    }

    &.active {
      color: #1f8a7d;
      font-weight: 700;
      background: #fff;
      box-shadow: 0 1px 4px rgba(68, 68, 102, 0.14);
    }
  }

  .card-title {
    margin-top: 26px;
    font-size: 20px;
    font-weight: 700;
    color: #444466;
    text-align: center;
  }

  .card-sub {
    margin-top: 6px;
    margin-bottom: 22px;
    font-size: 13px;
    color: #8a8aa8;
    text-align: center;
  }

  .login-form {
    :deep(.el-form-item__label) {
      font-size: 13px;
      color: #5d5d80;
      padding-bottom: 4px;
      line-height: 1.4;
    }

    :deep(.el-form-item) {
      margin-bottom: 18px;
    }
  }

  .submit-btn {
    width: 100%;
    height: 44px;
    margin-top: 6px;
    font-size: 15px;
  }

  .switch-tip {
    margin-top: 16px;
    font-size: 13px;
    color: #8a8aa8;
    text-align: center;

    a {
      color: #2fa596;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .strength-box {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
  }

  .strength-text {
    margin-left: 6px;
    font-size: 12px;
    color: #8a8aa8;
    white-space: nowrap;
  }

  .strength {
    display: inline-block;
    width: 26px;
    height: 6px;
    border-radius: 8px;
    background: #e6e9f2;
    flex: none;
  }
}
</style>
