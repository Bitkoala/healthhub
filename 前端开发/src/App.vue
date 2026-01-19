<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import { onMounted, onUnmounted, nextTick, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import ToastNotification from './components/ToastNotification.vue'
import { useUserStore } from './stores/user'
import { useLanguageStore } from './stores/language'
import AppFooter from './components/AppFooter.vue'
import MobileNavBar from './components/MobileNavBar.vue'
import MobileHeader from './components/MobileHeader.vue'
import DynamicSplashScreen from './components/DynamicSplashScreen.vue'

const showSplash = ref(true)
const onSplashFinished = () => {
  showSplash.value = false
}

declare const lucide: { createIcons: () => void };

const userStore = useUserStore()
const languageStore = useLanguageStore()
const router = useRouter()

// --- 移动端检测 ---
const isMobile = ref(window.innerWidth < 768)
const updateDeviceType = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  window.addEventListener('resize', updateDeviceType)
})
onUnmounted(() => {
  window.removeEventListener('resize', updateDeviceType)
})

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
  <div class="app-wrapper min-h-screen relative overflow-x-hidden pt-safe">
    <DynamicSplashScreen @finished="onSplashFinished" v-if="showSplash" />
    <!-- Dynamic Mesh Background -->
    <div class="fixed inset-0 -z-10 pointer-events-none opacity-40 dark:opacity-20 transition-opacity duration-1000">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 blur-[120px] rounded-full animate-float"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400 blur-[120px] rounded-full animate-float" style="animation-delay: -1.5s"></div>
    </div>

    <!-- Mobile Header (Conditional) -->
    <MobileHeader v-if="isMobile && userStore.isLoggedIn" />

    <!-- Global Navigation Floating Header -->
    <nav
      v-if="!isMobile && userStore.isLoggedIn"
      class="fixed top-6 left-1/2 -translate-x-1/2 glass-dock px-3 md:px-4 lg:px-6 py-3 rounded-full shadow-2xl z-50 flex items-center justify-start space-x-1 md:space-x-2 lg:space-x-4 max-w-[98vw] w-auto border border-white/20 dark:border-white/10 animate-nav-in overflow-x-auto no-scrollbar"
    >
      <!-- Group 1: General -->
      <div class="flex items-center space-x-1 lg:space-x-2">
        <RouterLink to="/" class="nav-item group" :title="$t('home')">
          <i data-lucide="home"></i>
          <span class="nav-label">{{ $t('home') }}</span>
        </RouterLink>
        <RouterLink to="/discovery" class="nav-item group" :title="$t('discovery')">
          <i data-lucide="sparkles"></i>
          <span class="nav-label">{{ $t('discovery') }}</span>
        </RouterLink>
        <RouterLink to="/profile" class="nav-item group" :title="$t('profile')">
          <div class="relative w-6 h-6 mx-auto">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              :alt="userStore.user?.username || ''"
              class="h-full w-full rounded-full border border-primary/20 bg-gray-100"
            />
            <i v-if="!avatarUrl" data-lucide="user"></i>
          </div>
          <span class="nav-label">{{ $t('profile') }}</span>
        </RouterLink>
      </div>
      
      <div class="h-6 lg:h-8 w-px bg-gray-300/50 dark:bg-gray-700/50 mx-1 lg:mx-2"></div>

      <!-- Group 2: Health -->
      <div class="flex items-center space-x-1 lg:space-x-2">
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

      <div class="h-6 lg:h-8 w-px bg-gray-300/50 dark:bg-gray-700/50 mx-1 lg:mx-2"></div>

      <!-- Group 3: Life -->
      <div class="flex items-center space-x-1 lg:space-x-2">
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

      <div class="h-6 lg:h-8 w-px bg-gray-300/50 dark:bg-gray-700/50 mx-1 lg:mx-2"></div>

      <!-- Group 4: System -->
      <div class="flex items-center space-x-1 pr-0">
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
        <div class="flex items-center space-x-1 ml-1 lg:ml-2">
          <button @click="toggleLanguage" class="action-mini-btn" :title="$t('language')">
            {{ languageStore.lang === 'zh' ? 'EN' : '中' }}
          </button>
          <button @click="handleLogout" class="action-mini-btn text-red-500/80" :title="$t('logout')">
            <i data-lucide="log-out" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </nav>

    <!-- Mobile Navigation (Conditional) -->
    <MobileNavBar v-if="isMobile && userStore.isLoggedIn" />

    <!-- Main Content Area -->
    <div class="min-h-screen flex flex-col">
      <main :class="['flex-grow container mx-auto px-4 transition-all duration-300', userStore.isLoggedIn ? (isMobile ? 'pt-20 pb-24' : 'max-w-5xl pt-32 pb-32') : 'max-w-none pt-8 pb-0']">
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
      <AppFooter v-if="!isMobile && (router.currentRoute.value.path === '/' || router.currentRoute.value.path === '/login')" />
    </div>
    
    <ToastNotification />
  </div>
</template>

<style>
.app-wrapper {
  background-attachment: fixed;
}

/* Nav Item Styling */
.nav-item {
  @apply flex flex-col items-center justify-center p-1.5 md:p-2 lg:px-3 rounded-2xl transition-all duration-300 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/80 dark:hover:bg-white/10 min-w-[3.5rem] lg:min-w-[4.5rem] gap-1.5;
}

.nav-item.router-link-active {
  @apply text-blue-600 dark:text-blue-400 bg-white/90 dark:bg-white/20 shadow-md ring-1 ring-black/5;
}

.nav-item i {
  @apply w-6 h-6 transition-transform duration-300 group-hover:scale-110;
}

.nav-label {
  @apply text-[11px] font-bold whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity text-center leading-none w-full block;
}

.action-mini-btn {
  @apply p-2 rounded-xl transition-all duration-300 bg-gray-100/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 flex items-center justify-center text-xs font-bold;
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
