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
import AppFooter from './components/AppFooter.vue'

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
  <div class="app-wrapper min-h-screen relative overflow-x-hidden">
    <!-- Dynamic Mesh Background -->
    <div class="fixed inset-0 -z-10 pointer-events-none opacity-40 dark:opacity-20 transition-opacity duration-1000">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 blur-[120px] rounded-full animate-float"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400 blur-[120px] rounded-full animate-float" style="animation-delay: -1.5s"></div>
    </div>

    <!-- Global Navigation Floating Header -->
    <nav
      v-if="userStore.isLoggedIn"
      class="fixed md:top-6 bottom-0 md:bottom-auto left-1/2 -translate-x-1/2 glass-dock px-2 md:px-6 py-1.5 md:py-3 md:rounded-full shadow-2xl z-50 flex items-center justify-around md:justify-start space-x-0 md:space-x-4 max-w-full md:max-w-[95vw] w-full md:w-auto overflow-x-auto no-scrollbar border-t md:border border-white/20 dark:border-white/10 animate-slide-up bg-white/90 dark:bg-slate-900/90 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none"
    >
      <!-- Group 1: General -->
      <div class="flex items-center space-x-0 md:space-x-2">
        <RouterLink to="/" class="nav-item group" :title="$t('home')">
          <i data-lucide="home"></i>
          <span class="nav-label">{{ $t('home') }}</span>
        </RouterLink>
        <RouterLink to="/profile" class="nav-item group" :title="$t('profile')">
          <div class="relative w-6 h-6 mb-1">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              :alt="userStore.user?.username || ''"
              class="h-full w-full rounded-full border border-primary/20 bg-gray-100"
            />
            <i v-else data-lucide="user"></i>
          </div>
          <span class="nav-label">{{ $t('profile') }}</span>
        </RouterLink>
      </div>
      
      <div class="hidden md:block h-8 w-px bg-gray-300/50 dark:bg-gray-700/50 mx-2"></div>

      <!-- Group 2: Health -->
      <div class="flex items-center space-x-0 md:space-x-2">
        <RouterLink to="/meds" class="nav-item group" :title="$t('meds')">
          <i data-lucide="pill"></i>
          <span class="nav-label">{{ $t('meds') }}</span>
        </RouterLink>
        <RouterLink to="/stool" class="nav-item group" :title="$t('stool')">
          <i data-lucide="droplets"></i>
          <span class="nav-label">{{ $t('stool') }}</span>
        </RouterLink>
        <RouterLink 
          v-if="userStore.user?.show_womens_health"
          to="/periods" 
          class="nav-item group" 
          :title="$t('periodTracker')"
        >
          <i data-lucide="calendar-heart"></i>
          <span class="nav-label">{{ $t('periodTracker') }}</span>
        </RouterLink>
        <RouterLink to="/weight" class="nav-item group" :title="$t('weightManagement')">
          <i data-lucide="weight"></i>
          <span class="nav-label">{{ $t('weightManagement') }}</span>
        </RouterLink>
      </div>

      <div class="hidden md:block h-8 w-px bg-gray-300/50 dark:bg-gray-700/50 mx-2"></div>

      <!-- Group 3: Life -->
      <div class="flex items-center space-x-0 md:space-x-2">
        <RouterLink to="/daily" class="nav-item group" :title="$t('checklist')">
          <i data-lucide="list-todo"></i>
          <span class="nav-label">{{ $t('checklist') }}</span>
        </RouterLink>
        <RouterLink to="/memos" class="nav-item group" :title="$t('memos')">
          <i data-lucide="sticky-note"></i>
          <span class="nav-label">{{ $t('memos') }}</span>
        </RouterLink>
        <RouterLink to="/finance" class="nav-item group" :title="$t('finance')">
          <i data-lucide="wallet"></i>
          <span class="nav-label">{{ $t('finance') }}</span>
        </RouterLink>
        <RouterLink to="/pomodoro" class="nav-item group" :title="$t('pomodoro')">
          <i data-lucide="timer"></i>
          <span class="nav-label">{{ $t('pomodoro') }}</span>
        </RouterLink>
      </div>

      <div class="hidden md:block h-8 w-px bg-gray-300/50 dark:bg-gray-700/50 mx-2"></div>

      <!-- Group 4: System -->
      <div class="flex items-center space-x-1 ml-auto md:ml-0 pr-2 md:pr-0">
        <!-- Admin -->
        <RouterLink
          v-if="userStore.isAdmin"
          to="/admin"
          class="nav-item group text-amber-500"
          title="管理"
        >
          <i data-lucide="shield-check"></i>
          <span class="nav-label">管理</span>
        </RouterLink>

        <!-- Actions -->
        <div class="flex items-center space-x-1 ml-2">
          <button @click="toggleLanguage" class="action-mini-btn" :title="$t('language')">
            {{ languageStore.lang === 'zh' ? 'EN' : '中' }}
          </button>
          <button @click="handleLogout" class="action-mini-btn text-red-500/80" :title="$t('logout')">
            <i data-lucide="log-out" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content Area -->
    <div class="min-h-screen flex flex-col">
      <main :class="['flex-grow container mx-auto px-4', userStore.isLoggedIn ? 'max-w-5xl pt-32 pb-32' : 'max-w-none pt-8 pb-0']">
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
      <AppFooter />
    </div>
    
    <ToastNotification />
  </div>
</template>

<style>
.app-wrapper {
  background-attachment: fixed;
}

@keyframes slide-up {
  from { opacity: 0; transform: translate(-50%, 20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

.animate-slide-up {
  animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Nav Item Styling */
.nav-item {
  @apply flex flex-col items-center justify-center p-1.5 md:p-2 md:px-3 rounded-2xl transition-all duration-300 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/80 dark:hover:bg-white/10 min-w-[3.2rem] md:min-w-[4rem];
}

.nav-item.router-link-active {
  @apply text-blue-600 dark:text-blue-400 bg-white/90 dark:bg-white/20 shadow-md ring-1 ring-black/5;
}

.nav-item i {
  @apply w-5 h-5 md:w-6 md:h-6 mb-1 transition-transform duration-300 group-hover:scale-110;
}

.nav-label {
  @apply text-[9px] md:text-[11px] font-bold whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity;
}

.action-mini-btn {
  @apply p-1.5 md:p-2 rounded-xl transition-all duration-300 bg-gray-100/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 flex items-center justify-center text-[10px] md:text-xs font-bold;
}

/* Page Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
