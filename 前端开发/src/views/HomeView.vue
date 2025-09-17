<!--
  @file src/views/HomeView.vue
  @description 应用的首页/仪表盘。

  - 这是一个静态展示页面，作为应用的门户。
  - 显示欢迎信息和指向各个功能模块的导航卡片。
  - 卡片使用了 Tailwind CSS 进行样式设计，并带有悬停效果和磨砂玻璃背景。
-->
<script setup lang="ts">
import { useUserStore } from '@/stores/user';
const userStore = useUserStore();
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-4xl">
    <header class="text-center mb-8">
      <!-- 标题区域，带有半透明背景和圆角，以增强在复杂背景下的可读性 -->
      <div class="inline-block bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl shadow">
        <h1 class="text-3xl md:text-4xl font-bold text-blue-600">{{ $t('home_title') }}</h1>
        <p class="text-gray-500 mt-2">{{ $t('home_subtitle') }}</p>
      </div>
    </header>

    <!-- 功能导航卡片网格 -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      <!-- 用药记录卡片 -->
      <a href="#/meds" class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10 w-full h-full transition-transform duration-300 flex flex-col items-center justify-center text-center gap-2 hover:-translate-y-1">
        <div class="icon-container"><i data-lucide="pilcrow" class="text-blue-500 w-10 h-10"></i></div>
        <div class="text-container">
          <h3 class="font-semibold text-gray-800 dark:text-gray-200">{{ $t('home_meds') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('home_meds_desc') }}</p>
        </div>
      </a>
      <!-- 排便记录卡片 -->
      <a href="#/stool" class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10 w-full h-full transition-transform duration-300 flex flex-col items-center justify-center text-center gap-2 hover:-translate-y-1">
        <div class="icon-container"><i data-lucide="activity" class="text-green-500 w-10 h-10"></i></div>
        <div class="text-container">
          <h3 class="font-semibold text-gray-800 dark:text-gray-200">{{ $t('home_stool') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('home_stool_desc') }}</p>
        </div>
      </a>
      <!-- 每日清单卡片 -->
      <a href="#/daily" class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10 w-full h-full transition-transform duration-300 flex flex-col items-center justify-center text-center gap-2 hover:-translate-y-1">
        <div class="icon-container"><i data-lucide="clipboard-list" class="text-yellow-500 w-10 h-10"></i></div>
        <div class="text-container">
          <h3 class="font-semibold text-gray-800 dark:text-gray-200">{{ $t('home_daily') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('home_daily_desc') }}</p>
        </div>
      </a>
      <!-- 备忘录卡片 -->
      <a href="#/memos" class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10 w-full h-full transition-transform duration-300 flex flex-col items-center justify-center text-center gap-2 hover:-translate-y-1">
        <div class="icon-container"><i data-lucide="check-square" class="text-purple-500 w-10 h-10"></i></div>
        <div class="text-container">
          <h3 class="font-semibold text-gray-800 dark:text-gray-200">{{ $t('home_memos') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('home_memos_desc') }}</p>
        </div>
      </a>
      <!-- 运动记录卡片 -->
      <a href="#/exercise" class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10 w-full h-full transition-transform duration-300 flex flex-col items-center justify-center text-center gap-2 hover:-translate-y-1">
        <div class="icon-container"><i data-lucide="bike" class="text-indigo-500 w-10 h-10"></i></div>
        <div class="text-container">
          <h3 class="font-semibold text-gray-800 dark:text-gray-200">{{ $t('home_exercise') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('home_exercise_desc') }}</p>
        </div>
      </a>
      <!-- 番茄钟卡片 -->
      <a href="#/pomodoro" class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10 w-full h-full transition-transform duration-300 flex flex-col items-center justify-center text-center gap-2 hover:-translate-y-1">
        <div class="icon-container"><i data-lucide="timer" class="text-orange-500 w-10 h-10"></i></div>
        <div class="text-container">
          <h3 class="font-semibold text-gray-800 dark:text-gray-200">{{ $t('home_pomodoro') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('home_pomodoro_desc') }}</p>
        </div>
      </a>
      <!-- 女性健康卡片 -->
      <a v-if="userStore.user?.show_womens_health" href="#/periods" class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10 w-full h-full transition-transform duration-300 flex flex-col items-center justify-center text-center gap-2 hover:-translate-y-1">
        <div class="icon-container"><i data-lucide="calendar-heart" class="text-pink-500 w-10 h-10"></i></div>
        <div class="text-container">
          <h3 class="font-semibold text-gray-800 dark:text-gray-200">{{ $t('home_periods') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('home_periods_desc') }}</p>
        </div>
      </a>
      <!-- 体重管理卡片 -->
      <a href="#/weight" class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10 w-full h-full transition-transform duration-300 flex flex-col items-center justify-center text-center gap-2 hover:-translate-y-1">
        <div class="icon-container"><i data-lucide="scale" class="text-teal-500 w-10 h-10"></i></div>
        <div class="text-container">
          <h3 class="font-semibold text-gray-800 dark:text-gray-200">{{ $t('home_weight') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('home_weight_desc') }}</p>
        </div>
      </a>
      <!-- 个人记账卡片 -->
      <a href="#/finance" class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10 w-full h-full transition-transform duration-300 flex flex-col items-center justify-center text-center gap-2 hover:-translate-y-1 col-span-2 md:col-span-3 lg:col-span-4">
        <div class="icon-container"><i data-lucide="landmark" class="text-red-500 w-10 h-10"></i></div>
        <div class="text-container">
          <h3 class="font-semibold text-gray-800 dark:text-gray-200">{{ $t('home_finance') }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('home_finance_desc') }}</p>
        </div>
      </a>
    </div>
  </div>
</template>
