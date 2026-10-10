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
      <span>您好，请登录</span>
    </div>
    <div class="login-box">
      <el-form
        :model="formData"
        :rules="rules"
        ref="formDataRef"
        label-width="100px"
        class="login-form"
        @submit.prevent
      >
        <el-form-item label="账号" prop="name">
          <el-input v-model="formData.name" size="large"></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="formData.password" size="large"></el-input>
        </el-form-item>

        <el-form-item label="" v-if="passwordStrength">
          <span
            class="strength"
            v-for="item in 3"
            :key="item"
            :style="{ backgroundColor: strengthColor[item - 1][passwordStrength] }"
          ></span>
        </el-form-item>

        <el-form-item class="button-group">
          <el-button
            :loading="pending.register"
            class="button register-button"
            @click="submitForm('register')"
          >
            注册
          </el-button>
          <el-button
            :loading="pending.login"
            size="small"
            type="primary"
            class="button"
            @click="submitForm('login')"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
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
}

interface Pending {
  login: boolean
  register: boolean
}

const formData = reactive<FormData>({
  name: '',
  password: ''
})

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
  name: [{ required: true, message: '请输入账号', trigger: 'blur' }]
}

const pending = reactive<Pending>({
  login: false,
  register: false
})

const formDataRef = ref<any>(null)
const passwordStrength = ref<'Strong' | 'Medium' | 'Weak'>()

const submitForm = (type: 'login' | 'register') => {
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
  overflow: hidden;
  height: 100vh;

  .login-top {
    color: #4a4c5b;
    height: 56px;
    background: #fff;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    img {
      width: 90px;
    }
  }

  .login-box {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
  }

  .login-form {
    border-radius: 8px;
    padding: 60px 60px 60px 0;
    background: #fff;
    box-shadow: 4px 0 20px 0 rgba(82, 82, 102, 0.15);
    margin-top: -150px;
    width: 580px;

    .button-group {
      margin-top: 40px;
    }

    .button {
      width: 204px;
      height: 40px;
      font-size: 14px;
    }

    .register-button {
      border-color: #3fd0bd;
      color: #3fd0bd;
    }
  }

  .tips {
    color: #999;
    position: fixed;
    bottom: 15px;
    text-align: center;
    margin-left: 50%;
    transform: translateX(-50%);
  }

  .strength {
    display: inline-block;
    width: 30%;
    height: 6px;
    border-radius: 8px;
    background: red;
    &:not(:first-child) {
      margin-left: 8px;
    }
  }
}
</style>
