<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { computed } from 'vue';

const userStore = useUserStore();

// Dynamic greeting based on time of day
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '早些休息';
  if (hour < 9) return '早安';
  if (hour < 12) return '上午好';
  if (hour < 14) return '午后好';
  if (hour < 18) return '下午好';
  return '晚安';
});
</script>

<template>
  <div class="space-y-12">
    <!-- Hero Section -->
    <header class="text-left py-4 md:py-8 animate-fade-in">
      <div class="flex items-center space-x-2 mb-2 md:mb-4">
        <span class="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] md:text-xs font-bold rounded-full uppercase tracking-wider">
          {{ greeting }}
        </span>
      </div>
      <h1 class="text-3xl md:text-5xl font-bold tracking-tight mb-2 md:mb-4">
        {{ $t('home_title').split(' ')[0] }} <span class="text-gradient">{{ $t('home_title').split(' ')[1] }}</span>
      </h1>
      <p class="text-sm md:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
        {{ $t('home_subtitle') }}。在这里，每一项数据都为您描绘更健康的未来。
      </p>
    </header>

    <!-- Main Features Grid -->
    <section>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Periodic Tracker (Pinned/Special if applicable) -->
        <RouterLink 
          v-if="userStore.user?.show_womens_health"
          to="/periods" 
          class="glass-card p-5 md:p-6 rounded-2xl md:rounded-[2rem] hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden h-full"
        >
          <div class="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
            <i data-lucide="calendar-heart" class="w-32 h-32 text-pink-500"></i>
          </div>
          <div class="relative z-10 flex flex-col h-full">
            <div class="p-4 bg-pink-500/10 rounded-2xl w-fit mb-6 group-hover:bg-pink-500 group-hover:text-white transition-colors duration-300">
              <i data-lucide="calendar-heart" class="w-8 h-8"></i>
            </div>
            <h3 class="text-xl font-bold mb-2">{{ $t('home_periods') }}</h3>
            <p class="text-sm text-on-surface-variant mb-4 flex-grow">
              {{ $t('home_periods_desc') }}
            </p>
            <div class="flex items-center text-pink-500 text-sm font-bold">
              <span>立即记录</span>
              <i data-lucide="chevron-right" class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>
        </RouterLink>

        <!-- Medication Card -->
        <RouterLink 
          to="/meds" 
          class="glass-card p-5 md:p-6 rounded-2xl md:rounded-[2rem] hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden"
        >
          <div class="relative z-10 flex flex-col h-full">
            <div class="p-4 bg-blue-500/10 text-blue-600 rounded-2xl w-fit mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
              <i data-lucide="pill" class="w-8 h-8"></i>
            </div>
            <h3 class="text-xl font-bold mb-2">{{ $t('home_meds') }}</h3>
            <p class="text-sm text-on-surface-variant mb-4 flex-grow">
              {{ $t('home_meds_desc') }}
            </p>
            <div class="flex items-center text-blue-600 text-sm font-bold">
              <span>管理用药</span>
              <i data-lucide="chevron-right" class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>
        </RouterLink>

        <!-- Stool Card -->
        <RouterLink 
          to="/stool" 
          class="glass-card p-5 md:p-6 rounded-2xl md:rounded-[2rem] hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden"
        >
          <div class="relative z-10 flex flex-col h-full">
            <div class="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl w-fit mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
              <i data-lucide="droplets" class="w-8 h-8"></i>
            </div>
            <h3 class="text-xl font-bold mb-2">{{ $t('home_stool') }}</h3>
            <p class="text-sm text-on-surface-variant mb-4 flex-grow">
              {{ $t('home_stool_desc') }}
            </p>
            <div class="flex items-center text-emerald-600 text-sm font-bold">
              <span>状态追踪</span>
              <i data-lucide="chevron-right" class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- Secondary Features Section -->
    <section class="space-y-6">
      <h2 class="text-xl font-bold px-2">生活助手</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Daily -->
        <RouterLink to="/daily" class="glass-card p-4 rounded-3xl hover:bg-white dark:hover:bg-white/10 transition-colors flex flex-col items-center text-center gap-3">
          <div class="p-3 bg-yellow-400/10 text-yellow-600 rounded-xl">
            <i data-lucide="list-todo" class="w-6 h-6"></i>
          </div>
          <span class="text-sm font-semibold">{{ $t('home_daily') }}</span>
        </RouterLink>
        <!-- Weight -->
        <RouterLink to="/weight" class="glass-card p-4 rounded-3xl hover:bg-white dark:hover:bg-white/10 transition-colors flex flex-col items-center text-center gap-3">
          <div class="p-3 bg-teal-400/10 text-teal-600 rounded-xl">
            <i data-lucide="weight" class="w-6 h-6"></i>
          </div>
          <span class="text-sm font-semibold">{{ $t('home_weight') }}</span>
        </RouterLink>
        <!-- Finance -->
        <RouterLink to="/finance" class="glass-card p-4 rounded-3xl hover:bg-white dark:hover:bg-white/10 transition-colors flex flex-col items-center text-center gap-3">
          <div class="p-3 bg-rose-400/10 text-rose-600 rounded-xl">
            <i data-lucide="wallet" class="w-6 h-6"></i>
          </div>
          <span class="text-sm font-semibold">{{ $t('home_finance') }}</span>
        </RouterLink>
        <!-- Pomodoro -->
        <RouterLink to="/pomodoro" class="glass-card p-4 rounded-3xl hover:bg-white dark:hover:bg-white/10 transition-colors flex flex-col items-center text-center gap-3">
          <div class="p-3 bg-indigo-400/10 text-indigo-600 rounded-xl">
            <i data-lucide="timer" class="w-6 h-6"></i>
          </div>
          <span class="text-sm font-semibold">{{ $t('pomodoro') }}</span>
        </RouterLink>
        <!-- More -->
        <div class="glass-card p-4 rounded-3xl opacity-50 flex flex-col items-center text-center gap-3">
          <div class="p-3 bg-gray-400/10 text-gray-400 rounded-xl">
            <i data-lucide="more-horizontal" class="w-6 h-6"></i>
          </div>
          <span class="text-sm font-semibold">更多功能</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
