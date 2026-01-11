<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToastStore } from '@/stores/toast'
import { apiRequest } from '@/api'

const router = useRouter()
const userStore = useUserStore()
const toastStore = useToastStore()

// --- State ---
const isLoginMode = ref(true)
const isLoading = ref(false)
const formData = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const authError = ref(window.location.search.includes('error') ? '认证失败，请重试' : '')

// --- Methods ---
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  authError.value = ''
}

const handleLocalAuth = async () => {
  if (isLoading.value) return
  
  // Validation
  if (isLoginMode.value) {
    if (!formData.value.username || !formData.value.password) {
      toastStore.showToast({ message: '请填写完整登录信息', type: 'error' })
      return
    }
  } else {
    if (!formData.value.username || !formData.value.email || !formData.value.password) {
      toastStore.showToast({ message: '请填写完整注册信息', type: 'error' })
      return
    }
    if (formData.value.password !== formData.value.confirmPassword) {
      toastStore.showToast({ message: '两次输入的密码不一致', type: 'error' })
      return
    }
  }

  isLoading.value = true
  try {
    const endpoint = isLoginMode.value ? '/auth/login' : '/auth/register'
    const payload = isLoginMode.value 
      ? { username: formData.value.username, password: formData.value.password }
      : { username: formData.value.username, email: formData.value.email, password: formData.value.password }
    
    const response = await apiRequest(endpoint, 'POST', payload)
    
    if (response.token) {
      localStorage.setItem('authToken', response.token)
      await userStore.fetchUser()
      toastStore.showToast({ message: isLoginMode.value ? '登录成功' : '注册成功', type: 'success' })
      router.push('/')
    }
  } catch (error: any) {
    console.error('Auth error:', error)
    toastStore.showToast({ message: error.message || '认证失败', type: 'error' })
  } finally {
    isLoading.value = false
  }
}

const loginWithLinuxDo = () => {
  const baseUrl = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3000/api';
  window.location.href = `${baseUrl}/auth/linuxdo`;
}

const loginWithGoogle = () => {
  const baseUrl = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3000/api';
  window.location.href = `${baseUrl}/auth/google`;
}

const loginWithGithub = () => {
  const baseUrl = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3000/api';
  window.location.href = `${baseUrl}/auth/github`;
}

onMounted(() => {
    if (userStore.isLoggedIn) {
        router.push('/')
    }
})
</script>

<template>
  <div class="min-h-screen flex flex-col app-wrapper overflow-hidden relative">
    <!-- Dynamic Mesh Background -->
    <div class="fixed inset-0 -z-10 pointer-events-none opacity-40 dark:opacity-20 transition-opacity duration-1000">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 blur-[120px] rounded-full animate-float"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400 blur-[120px] rounded-full animate-float" style="animation-delay: -1.5s"></div>
    </div>

    <!-- Branding Header -->
    <header class="absolute top-0 left-0 right-0 z-50 py-8 px-8 md:px-12 lg:px-16">
      <div class="flex items-center space-x-4">
        <div class="flex items-center">
          <img src="https://pickoala.com/img/images/2026/01/05/xG3tSjft.webp" alt="Company Logo" class="h-7 md:h-8 w-auto dark:hidden">
          <img src="https://pickoala.com/img/images/2026/01/05/tEGzX5DN.webp" alt="Company Logo" class="h-7 md:h-8 w-auto hidden dark:block">
        </div>
        <div class="h-5 w-px bg-gray-300 dark:bg-gray-700"></div>
        <div class="flex items-center">
          <img src="https://pickoala.com/img/images/2026/01/05/zaajujcv.webp" alt="Project Logo" class="h-10 md:h-12 w-auto dark:hidden">
          <img src="https://pickoala.com/img/images/2026/01/05/EOiSqYhH.webp" alt="Project Logo" class="h-10 md:h-12 w-auto hidden dark:block">
        </div>
      </div>
    </header>

    <div class="flex-grow flex flex-col lg:flex-row">
      <!-- Left Side: Branding & Features -->
      <div class="lg:w-1/2 flex flex-col justify-center p-8 md:p-16 lg:p-32 space-y-10 animate-fade-in">
        <div class="space-y-4 pt-16 lg:pt-0">
          <div class="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
            <i data-lucide="sparkles" class="w-3 h-3"></i>
            <span>智慧健康管理</span>
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight">
            考拉 <span class="text-gradient">健康</span><br/>
            <span class="text-2xl md:text-3xl lg:text-4xl text-on-surface-variant font-medium">Koala Health</span>
          </h1>
          <p class="text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed">
            让每一项健康数据都有迹可循。您的私人健康与生活管家，陪伴您走过每一个活力瞬间。
          </p>
        </div>

        <!-- Feature Badges -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div class="flex items-center space-x-4 p-5 glass-card rounded-3xl group">
            <div class="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
              <i data-lucide="pilcrow" class="w-6 h-6"></i>
            </div>
            <span class="font-bold text-lg">科学用药追踪</span>
          </div>
          <div class="flex items-center space-x-4 p-5 glass-card rounded-3xl group">
            <div class="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <i data-lucide="activity" class="w-6 h-6"></i>
            </div>
            <span class="font-bold text-lg">布里斯托排便追踪</span>
          </div>
        </div>
      </div>

      <!-- Right Side: Login Content -->
      <div class="lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-24 animate-fade-in" style="animation-delay: 0.2s">
        <div class="glass-card w-full max-w-lg p-10 md:p-16 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div class="relative z-10 space-y-8">
            <div class="text-center space-y-2">
              <h2 class="text-3xl font-bold tracking-tight">{{ isLoginMode ? '欢迎回来' : '开启健康之旅' }}</h2>
              <p class="text-on-surface-variant/80">{{ isLoginMode ? '登录您的账户以继续' : '创建一个新账户以开始管理您的健康' }}</p>
            </div>

            <form @submit.prevent="handleLocalAuth" class="space-y-4">
              <!-- Local Auth Fields -->
              <div class="space-y-4">
                <div class="relative group">
                  <input 
                    v-model="formData.username"
                    type="text" 
                    placeholder="用户名或邮箱"
                    class="w-full h-14 pl-12 pr-4 bg-surface-variant/20 border border-on-surface-variant/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    required
                  >
                  <i data-lucide="user" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40 group-focus-within:text-blue-500 transition-colors"></i>
                </div>

                <div v-if="!isLoginMode" class="relative group animate-slide-down">
                  <input 
                    v-model="formData.email"
                    type="email" 
                    placeholder="电子邮箱"
                    class="w-full h-14 pl-12 pr-4 bg-surface-variant/20 border border-on-surface-variant/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    required
                  >
                  <i data-lucide="mail" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40 group-focus-within:text-blue-500 transition-colors"></i>
                </div>

                <div class="relative group">
                  <input 
                    v-model="formData.password"
                    type="password" 
                    placeholder="密码"
                    class="w-full h-14 pl-12 pr-4 bg-surface-variant/20 border border-on-surface-variant/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    required
                  >
                  <i data-lucide="lock" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40 group-focus-within:text-blue-500 transition-colors"></i>
                </div>

                <div v-if="!isLoginMode" class="relative group animate-slide-down">
                  <input 
                    v-model="formData.confirmPassword"
                    type="password" 
                    placeholder="确认密码"
                    class="w-full h-14 pl-12 pr-4 bg-surface-variant/20 border border-on-surface-variant/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    required
                  >
                  <i data-lucide="check-circle" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40 group-focus-within:text-blue-500 transition-colors"></i>
                </div>
              </div>

              <button
                type="submit"
                :disabled="isLoading"
                class="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <i v-if="isLoading" class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></i>
                <span>{{ isLoginMode ? '登录' : '注册' }}</span>
              </button>
            </form>

            <div class="relative py-2">
              <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-on-surface-variant/10"></div></div>
              <div class="relative flex justify-center text-xs uppercase"><span class="px-2 bg-transparent text-on-surface-variant/40">或者使用第三方账号</span></div>
            </div>

            <!-- OAuth Buttons -->
            <div class="grid grid-cols-3 gap-3">
              <button 
                @click="loginWithLinuxDo"
                class="h-14 flex items-center justify-center bg-surface-variant/10 hover:bg-surface-variant/20 border border-on-surface-variant/10 rounded-2xl transition-all active:scale-95"
                title="Linux.do"
              >
                <img src="https://ssl.shanku.lol/pickoala/linux.png" class="w-5 h-5 rounded-full" alt="Linux.do">
              </button>
              <button 
                @click="loginWithGoogle"
                class="h-14 flex items-center justify-center bg-surface-variant/10 hover:bg-surface-variant/20 border border-on-surface-variant/10 rounded-2xl transition-all active:scale-95"
                title="Google"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              </button>
              <button 
                @click="loginWithGithub"
                class="h-14 flex items-center justify-center bg-surface-variant/10 hover:bg-surface-variant/20 border border-on-surface-variant/10 rounded-2xl transition-all active:scale-95"
                title="GitHub"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </button>
            </div>

            <p class="text-center text-sm text-on-surface-variant/60">
              {{ isLoginMode ? '还没有账户？' : '已经有账户？' }}
              <button @click="toggleMode" class="text-blue-500 font-bold hover:underline">
                {{ isLoginMode ? '填写注册信息' : '返回登录' }}
              </button>
            </p>

            <!-- Error Message -->
            <transition name="fade">
              <p v-if="authError" class="text-center text-red-500 text-sm font-semibold py-2 px-4 bg-red-500/10 rounded-xl border border-red-500/20">
                {{ authError }}
              </p>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
.animate-slide-down { animation: slideDown 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
</style>
