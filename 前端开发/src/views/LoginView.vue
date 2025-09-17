<!--
  @file src/views/LoginView.vue
  @description 用户登录与注册页面。

  - 提供邮箱/密码登录和注册功能。
  - 支持通过第三方服务 (Linux.do) 进行 OAuth 登录。
  - 登录成功后，将获取的 JWT 存储到 localStorage，并触发 'storage' 事件以通知其他组件更新状态，然后跳转到首页。
  - 注册成功后，提示用户并切换回登录模式。
  - 显示认证过程中可能出现的错误信息。
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiRequest } from '../api.js'
import { useUserStore } from '@/stores/user'
import { useLanguageStore } from '@/stores/language'

const router = useRouter()
const userStore = useUserStore()

// --- 响应式状态 ---
const isLogin = ref(true) // true: 登录模式, false: 注册模式
const authForm = ref({ identifier: '', password: '', email: '' }) // 统一使用 identifier, email 仅在注册时可选
const authError = ref('') // 存储认证错误信息

// --- 方法 ---

/**
 * @function handleAuth
 * @description 处理登录或注册逻辑。
 * - 根据 isLogin 的值决定是调用登录还是注册接口。
 * - 登录成功后，保存 token 并跳转到首页。
 * - 注册成功后，提示用户并切换到登录视图。
 */
const handleAuth = async () => {
  authError.value = ''
  const endpoint = isLogin.value ? '/login' : '/register'
  try {
    const payload: {
      password: string
      identifier?: string
      username?: string
      email?: string
    } = {
      password: authForm.value.password,
    }

    if (isLogin.value) {
      // 登录时，发送 identifier
      payload.identifier = authForm.value.identifier
    } else {
      // 注册时，发送 username 和 email
      payload.username = authForm.value.identifier // 主输入框作为用户名
      payload.email = authForm.value.email // 可选的 email 输入框作为邮箱

      // 如果主输入框内容是邮箱格式，且邮箱字段为空，则将主输入框内容同时作为 email
      if (
        /\S+@\S+\.\S+/.test(payload.username) &&
        !payload.email
      ) {
        payload.email = payload.username
      }
    }

    const data = await apiRequest(endpoint, 'POST', payload)

    if (isLogin.value) {
      localStorage.setItem('authToken', data.token)
      // 登录成功后，立即获取用户信息并更新全局状态
      await userStore.fetchUser()
      router.push('/')
    } else {
      alert(useLanguageStore().t('registrationSuccess'))
      isLogin.value = true
      authForm.value = { identifier: '', password: '', email: '' }
    }
  } catch (error) {
    if (error instanceof Error) {
      authError.value = error.message
    } else {
      authError.value = '发生未知错误'
    }
  }
}

/**
 * @function loginWithLinuxDo
 * @description 通过 Linux.do 进行第三方 OAuth 登录。
 * - 将页面重定向到后端的 OAuth 发起端点。
 */
const loginWithLinuxDo = () => {
  // 从全局配置中读取 API 基地址，避免硬编码
  const baseUrl = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3000';
  window.location.href = `${baseUrl}/linuxdo`;
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <!-- 【修改】将 bg-white 改为半透明的磨砂玻璃效果 -->
    <div
      class="max-w-md w-full bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20"
    >
      <h2 class="text-2xl font-bold text-center text-blue-600 mb-6">
        {{ isLogin ? $t('login') : $t('register') }}
      </h2>
      <form @submit.prevent="handleAuth">
        <div class="mb-4">
          <label for="identifier" class="block text-sm font-medium text-gray-700">{{
            isLogin ? $t('identifier') : $t('username')
          }}</label>
          <input
            type="text"
            id="identifier"
            v-model="authForm.identifier"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <!-- 仅在注册时显示可选的邮箱字段 -->
        <div v-if="!isLogin" class="mb-4">
          <label for="email" class="block text-sm font-medium text-gray-700"
            >{{ $t('emailOptional') }}</label
          >
          <input
            type="email"
            id="email"
            v-model="authForm.email"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">
            {{ $t('emailHint') }}
          </p>
        </div>
        <div class="mb-6">
          <label for="password" class="block text-sm font-medium text-gray-700"
            >{{ $t('passwordHint') }}</label
          >
          <input
            type="password"
            v-model="authForm.password"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
        >
          {{ isLogin ? $t('login') : $t('register') }}
        </button>
      </form>
      <p class="text-center text-sm text-gray-600 mt-4">
        <span>{{ isLogin ? $t('noAccount') : $t('hasAccount') }}</span>
        <a
          href="#"
          @click.prevent="isLogin = !isLogin"
          class="font-medium text-blue-600 hover:text-blue-500"
          >{{ isLogin ? $t('registerNow') : $t('loginNow') }}</a
        >
      </p>
      <p v-if="authError" class="text-red-500 text-sm mt-2 text-center">{{ authError }}</p>

      <!-- 分隔线 -->
      <div class="my-6 flex items-center justify-center">
        <span class="border-b w-1/3"></span>
        <span class="text-xs text-center text-gray-500 uppercase mx-3">{{ $t('or') }}</span>
        <span class="border-b w-1/3"></span>
      </div>

      <!-- 第三方登录 -->
      <div class="flex justify-center">
        <button
          @click="loginWithLinuxDo"
          class="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center"
        >
          <svg
            class="w-5 h-5 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          {{ $t('loginWithLinuxDo') }}
        </button>
      </div>
    </div>
  </div>
</template>
