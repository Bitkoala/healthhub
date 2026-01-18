<script setup lang="ts">
import { useUserStore } from '../stores/user'
import { useLanguageStore } from '../stores/language'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const userStore = useUserStore()
const languageStore = useLanguageStore()
const route = useRoute()

const toggleLanguage = () => {
  const newLang = languageStore.lang === 'zh' ? 'en' : 'zh';
  languageStore.setLanguage(newLang);
}

const avatarUrl = computed(() => {
  if (userStore.user?.id) {
    return `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${userStore.user.id}`
  }
  return ''
})

const pageTitle = computed(() => {
  const name = route.name as string
  if (!name) return 'HEALTH HUB'
  
  const titles: Record<string, { zh: string, en: string }> = {
    'home': { zh: '首页', en: 'Home' },
    'meds': { zh: '用药清单', en: 'Medications' },
    'finance': { zh: '财务中心', en: 'Finance' },
    'daily': { zh: '每日清单', en: 'Daily Checklist' },
    'stool': { zh: '排便记录', en: 'Stool Log' },
    'periods': { zh: '经期追踪', en: 'Periods' },
    'weight': { zh: '体重管理', en: 'Weight' },
    'memos': { zh: '备忘录', en: 'Memos' },
    'pomodoro': { zh: '番茄钟', en: 'Pomodoro' },
    'profile': { zh: '个人中心', en: 'Profile' },
    'admin': { zh: '管理面板', en: 'Admin' }
  }
  
  return titles[name]?.[languageStore.lang as 'zh' | 'en'] || 'HEALTH HUB'
})
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 glass-effect h-16 flex items-center justify-between px-6 border-b border-white/10">
    <div class="flex items-center space-x-3">
      <img src="https://pickoala.com/img/images/2026/01/05/zaajujcv.webp" alt="Logo" class="h-8 w-auto dark:hidden" />
      <img src="https://pickoala.com/img/images/2026/01/05/EOiSqYhH.webp" alt="Logo" class="h-8 w-auto hidden dark:block" />
      <span class="text-sm font-bold tracking-tight text-on-surface truncate max-w-[120px]">{{ pageTitle }}</span>
    </div>

    <div class="flex items-center space-x-4">
      <button @click="toggleLanguage" class="w-8 h-8 rounded-full bg-surface-variant/20 flex items-center justify-center text-xs font-bold text-on-surface-variant">
        {{ languageStore.lang === 'zh' ? 'EN' : '中' }}
      </button>
      <div v-if="userStore.isLoggedIn" class="w-8 h-8 rounded-full overflow-hidden border border-primary/20 bg-gray-100">
        <img v-if="avatarUrl" :src="avatarUrl" alt="User" class="w-full h-full object-cover" />
        <i v-else data-lucide="user" class="w-5 h-5 m-1.5 text-on-surface-variant"></i>
      </div>
    </div>
  </header>
</template>

<style scoped>
.glass-effect {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
</style>
