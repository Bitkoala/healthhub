<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

const userStore = useUserStore()
const router = useRouter()
const showMoreMenu = ref(false)

declare const lucide: { createIcons: () => void }

// Helper for haptic feedback
const triggerHaptics = async () => {
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch (e) {
    // Fail silently if not in a native environment
  }
}

const toggleMoreMenu = () => {
  triggerHaptics()
  showMoreMenu.value = !showMoreMenu.value
  if (showMoreMenu.value) {
    nextTick(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons()
    })
  }
}

const closeMenu = () => {
  showMoreMenu.value = false
}

// Close menu on route change and trigger haptics
router.afterEach(() => {
  closeMenu()
})

const handleNavClick = () => {
  triggerHaptics()
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 glass-dock pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.1)] border-t border-white/10 flex justify-around items-center h-20 px-2">
    <RouterLink to="/" class="mobile-nav-item" active-class="active" @click="handleNavClick">
      <i data-lucide="home"></i>
      <span>{{ $t('home') }}</span>
    </RouterLink>
    
    <RouterLink to="/meds" class="mobile-nav-item" active-class="active" @click="handleNavClick">
      <i data-lucide="pill"></i>
      <span>{{ $t('meds') }}</span>
    </RouterLink>

    <RouterLink to="/finance" class="mobile-nav-item" active-class="active" @click="handleNavClick">
      <i data-lucide="wallet"></i>
      <span>{{ $t('finance') }}</span>
    </RouterLink>

    <RouterLink to="/daily" class="mobile-nav-item" active-class="active" @click="handleNavClick">
      <i data-lucide="list-todo"></i>
      <span>{{ $t('checklist') }}</span>
    </RouterLink>

    <button @click="toggleMoreMenu" class="mobile-nav-item" :class="{ 'active': showMoreMenu }">
      <i :data-lucide="showMoreMenu ? 'x' : 'layout-grid'"></i>
      <span>{{ $t('more') }}</span>
    </button>
  </nav>

  <!-- More Menu Overlay -->
  <Transition name="fade-slide">
    <div v-if="showMoreMenu" class="fixed inset-0 z-[40] bg-black/60 backdrop-blur-md pb-safe" @click.self="closeMenu">
      <div class="absolute bottom-24 left-4 right-4 glass-card rounded-[2.5rem] p-6 grid grid-cols-3 gap-4 animate-slide-up-menu">
        <RouterLink to="/stool" class="more-menu-item" @click="handleNavClick">
          <div class="icon-box bg-orange-500/10 text-orange-600">
            <i data-lucide="droplets"></i>
          </div>
          <span>{{ $t('stool') }}</span>
        </RouterLink>

        <RouterLink v-if="userStore.user?.show_womens_health" to="/periods" class="more-menu-item" @click="handleNavClick">
          <div class="icon-box bg-pink-500/10 text-pink-600">
            <i data-lucide="calendar-heart"></i>
          </div>
          <span>{{ $t('periodTracker') }}</span>
        </RouterLink>

        <RouterLink to="/weight" class="more-menu-item" @click="handleNavClick">
          <div class="icon-box bg-teal-500/10 text-teal-600">
            <i data-lucide="weight"></i>
          </div>
          <span>{{ $t('weightManagement') }}</span>
        </RouterLink>

        <RouterLink to="/memos" class="more-menu-item" @click="handleNavClick">
          <div class="icon-box bg-blue-500/10 text-blue-600">
            <i data-lucide="sticky-note"></i>
          </div>
          <span>{{ $t('memos') }}</span>
        </RouterLink>

        <RouterLink to="/pomodoro" class="more-menu-item" @click="handleNavClick">
          <div class="icon-box bg-red-500/10 text-red-600">
            <i data-lucide="timer"></i>
          </div>
          <span>{{ $t('pomodoro') }}</span>
        </RouterLink>

        <RouterLink to="/profile" class="more-menu-item" @click="handleNavClick">
          <div class="icon-box bg-purple-500/10 text-purple-600">
            <i data-lucide="user"></i>
          </div>
          <span>{{ $t('profile') }}</span>
        </RouterLink>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.glass-dock {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.dark .glass-dock {
  background: rgba(0, 0, 0, 0.2);
}

.mobile-nav-item {
  @apply flex flex-col items-center justify-center space-y-1 text-gray-400 dark:text-gray-500 transition-all duration-300 w-16 bg-transparent border-none outline-none;
}

.mobile-nav-item span {
  @apply text-[10px] font-bold tracking-tight opacity-70;
}

.mobile-nav-item i {
  @apply w-6 h-6 transition-transform duration-300;
}

.mobile-nav-item.active {
  @apply text-blue-600 dark:text-blue-400;
}

.mobile-nav-item.active span {
  @apply opacity-100;
}

.mobile-nav-item.active i {
  @apply scale-110;
}

/* More Menu Items */
.more-menu-item {
  @apply flex flex-col items-center justify-center p-4 space-y-2 rounded-2xl hover:bg-white/10 transition-all active:scale-95;
}

.more-menu-item span {
  @apply text-xs font-bold text-on-surface opacity-80;
}

.icon-box {
  @apply p-3 rounded-2xl flex items-center justify-center;
}

.icon-box i {
  @apply w-6 h-6;
}

/* Animations */
.fade-slide-enter-active, .fade-slide-leave-active {
  @apply transition-all duration-300 ease-out;
}

.fade-slide-enter-from, .fade-slide-leave-to {
  @apply opacity-0 translate-y-4;
}

@keyframes slide-up-menu {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-slide-up-menu {
  animation: slide-up-menu 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
