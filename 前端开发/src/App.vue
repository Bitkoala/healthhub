<!--
  @file src/App.vue
  @description 应用的根组件。

  - 使用 Pinia (userStore) 集中管理用户状态。
  - 包含全局的导航栏和路由视图 <RouterView>。
  - 导航栏在用户登录后显示，并展示用户名和头像。
  - 提供登出功能。
  - 使用 Lucide 图标库，并在组件挂载和路由切换后重新渲染图标。
-->
<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import { onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import ToastNotification from './components/ToastNotification.vue'
import { useUserStore } from './stores/user'
import { useLanguageStore } from './stores/language'

declare const lucide: { createIcons: () => void };

const userStore = useUserStore()
const languageStore = useLanguageStore()
const router = useRouter()

const toggleLanguage = () => {
  const newLang = languageStore.lang === 'zh' ? 'en' : 'zh';
  languageStore.setLanguage(newLang);
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

// 为用户生成一个基于其ID的固定随机头像
const avatarUrl = computed(() => {
  if (userStore.user?.id) {
    // 使用 DiceBear API 生成一个机器人风格的头像
    return `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${userStore.user.id}`
  }
  return '' // 如果没有用户ID，则不显示头像
})

// 组件挂载时，立即获取用户状态。
// userStore 会处理 token 不存在或无效的情况。
onMounted(() => {
  // 添加 .catch 来处理 fetchUser 可能抛出的错误，防止在控制台显示为未捕获的异常
  userStore.fetchUser().catch(() => {
    // 错误处理已在 store 内部和路由守卫中完成，此处无需额外操作
  });
})

// 尝试渲染图标，如果 lucide 库尚未加载，则进行重试
const tryRenderIcons = (retries = 5, delay = 100) => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  } else if (retries > 0) {
    setTimeout(() => tryRenderIcons(retries - 1, delay), delay);
  }
};

onMounted(() => {
  userStore.fetchUser().catch(() => {
    // 错误已在别处处理
  });
  // 初始加载时渲染图标
  tryRenderIcons();
});

// 每次路由切换后，重新渲染图标以确保新页面的图标能正确显示
router.afterEach(() => {
  nextTick(() => {
    tryRenderIcons();
  });
});
</script>

<template>
  <nav
    v-if="userStore.isLoggedIn"
    class="fixed bottom-0 left-0 right-0 bg-white shadow-t-lg border-t z-50 md:top-0 md:bottom-auto md:border-b"
  >
    <div
      class="max-w-4xl mx-auto flex justify-around p-2 md:justify-end md:items-center md:space-x-4 md:px-6"
    >
      <RouterLink to="/" class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="home"></i><span class="text-xs mt-1">{{ $t('home') }}</span></RouterLink
      >
      <RouterLink
        to="/meds"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="pilcrow"></i><span class="text-xs mt-1">{{ $t('meds') }}</span></RouterLink
      >
      <RouterLink
        to="/stool"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="activity"></i><span class="text-xs mt-1">{{ $t('stool') }}</span></RouterLink
      >
      <RouterLink
        to="/daily"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="clipboard-list"></i><span class="text-xs mt-1">{{ $t('checklist') }}</span></RouterLink
      >
      <RouterLink
        to="/memos"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="check-square"></i><span class="text-xs mt-1">{{ $t('memos') }}</span></RouterLink
      >
      <RouterLink
        to="/finance"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="dollar-sign"></i><span class="text-xs mt-1">{{ $t('finance') }}</span></RouterLink
      >
      <RouterLink
        to="/pomodoro"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="timer"></i><span class="text-xs mt-1">{{ $t('pomodoro') }}</span></RouterLink
      >
      <RouterLink
        to="/exercise"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="bike"></i><span class="text-xs mt-1">{{ $t('exercise') }}</span></RouterLink
      >
      <RouterLink
        v-if="userStore.user?.show_womens_health"
        to="/periods"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="calendar-heart"></i><span class="text-xs mt-1">{{ $t('periodTracker') }}</span></RouterLink
      >
      <RouterLink
        to="/weight"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="scale"></i><span class="text-xs mt-1">{{ $t('weightManagement') }}</span></RouterLink
      >

      <!-- 管理员入口 -->
      <RouterLink
        v-if="userStore.isAdmin"
        to="/admin"
        class="nav-link flex flex-col items-center text-red-500 hover:text-red-700"
        ><i data-lucide="shield"></i><span class="text-xs mt-1">{{ $t('admin') }}</span></RouterLink
      >

      <!-- 分隔线 (仅在桌面端显示) -->
      <div class="hidden md:block border-l border-gray-300 h-6"></div>

      <!-- 语言切换按钮 -->
      <button @click="toggleLanguage" class="flex flex-col items-center text-gray-500 hover:text-blue-600">
        <i data-lucide="languages"></i><span class="text-xs mt-1">{{ languageStore.lang === 'zh' ? 'EN' : '中' }}</span>
      </button>

      <!-- 用户信息和头像 -->
      <RouterLink
        to="/profile"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
      >
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          alt="User Avatar"
          class="h-6 w-6 rounded-full bg-gray-200"
        />
        <i v-else data-lucide="user"></i>
        <span class="text-xs mt-1">{{ userStore.user?.username || $t('profile') }}</span>
      </RouterLink>

      <!-- 登出按钮 -->
      <button
        @click="handleLogout"
        class="flex flex-col items-center text-gray-500 hover:text-red-600"
      >
        <i data-lucide="log-out"></i><span class="text-xs mt-1">{{ $t('logout') }}</span>
      </button>
    </div>
  </nav>

  <main class="pb-20 md:pt-16">
    <RouterView />
  </main>
  <ToastNotification />
</template>
