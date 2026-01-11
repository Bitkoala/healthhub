<template>
  <footer class="mt-auto relative z-10 w-full pb-10 pt-20 px-6 sm:px-12 lg:px-20 overflow-visible">
    <!-- Subtle Top Glow Divider -->
    <div class="absolute top-10 left-1/2 -translate-x-1/2 w-4/5 h-[1px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"></div>

    <div class="flex flex-col lg:flex-row justify-between items-start gap-12 lg:gap-24">
      <!-- Left Side: Brand Identity & Vision -->
      <div class="flex flex-col space-y-8 transition-all duration-500 animate-fade-in" style="animation-delay: 0.1s">
        <div class="flex items-center space-x-4">
          <img src="https://pickoala.com/img/images/2026/01/05/xG3tSjft.webp" alt="Company Logo" class="h-6 w-auto grayscale-0 brightness-100 dark:brightness-110">
          <div class="h-6 w-px bg-blue-500/20"></div>
          <img src="https://pickoala.com/img/images/2026/01/05/zaajujcv.webp" alt="Project Logo" class="h-8 w-auto grayscale-0 brightness-100 dark:brightness-110">
        </div>
        
        <div class="space-y-4 max-w-lg">
          <h3 class="text-sm font-bold tracking-widest text-on-surface-variant uppercase">九如投资发展旗下品牌</h3>
          <p class="text-xs text-on-surface-variant/60 leading-relaxed">
            九如投资发展旗下核心健康管理品牌。我们致力于通过科技手段提升健康管理效率，让每一个家庭都能享受到触手可及的健康服务。
          </p>
        </div>
      </div>

      <!-- Right Side: Connectivity & Legal -->
      <div class="flex flex-col items-center lg:items-end space-y-10 transition-all duration-500 animate-fade-in" style="animation-delay: 0.3s">
        <!-- Social Interactions -->
        <div class="flex items-center gap-4">
          <!-- GitHub -->
          <a href="https://github.com/Bitkoala" target="_blank" class="social-icon-btn group" title="GitHub">
            <i data-lucide="github" class="w-5 h-5"></i>
          </a>
          
          <!-- X -->
          <a href="https://x.com/Bitekaola" target="_blank" class="social-icon-btn group" title="X (Twitter)">
            <i data-lucide="twitter" class="w-5 h-5"></i>
          </a>

          <!-- Telegram -->
          <a href="https://t.me/BitekaolaTeam" target="_blank" class="social-icon-btn group" title="Telegram">
            <i data-lucide="send" class="w-5 h-5"></i>
          </a>

          <!-- WeChat -->
          <div class="relative group cursor-pointer">
            <div class="social-icon-btn active:scale-95">
              <i data-lucide="message-circle" class="w-5 h-5"></i>
            </div>
            <div class="absolute bottom-full right-0 lg:right-0 mb-4 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
              <div class="p-3 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-3xl bg-white/70 dark:bg-black/40 ring-1 ring-black/5">
                <img src="https://pickoala.com/img/images/2026/01/05/RM45hGH4.webp" alt="WeChat QR Code" class="w-full h-auto rounded-xl">
                <p class="text-[10px] text-center mt-2 font-bold tracking-widest text-on-surface-variant/60 uppercase">扫码关注微信</p>
              </div>
            </div>
          </div>

          <!-- Discord -->
          <a href="https://discord.gg/QbdktDgGm8" target="_blank" class="social-icon-btn group" title="Discord">
            <i data-lucide="message-square" class="w-5 h-5"></i>
          </a>
        </div>

        <!-- Legal & Meta -->
        <div class="flex flex-col items-center lg:items-end space-y-4">
          <div class="flex items-center space-x-8 text-xs font-semibold tracking-wide text-on-surface-variant/70">
            <a href="https://www.joru.email/privacy.html" target="_blank" class="hover:text-blue-500 transition-colors">隐私政策</a>
            <span class="w-1 h-1 bg-blue-500/20 rounded-full"></span>
            <a href="https://www.joru.email/terms.html" target="_blank" class="hover:text-blue-500 transition-colors">服务条款</a>
          </div>
          
          <div class="flex flex-col items-center lg:items-end space-y-2 text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/30">
            <div class="flex items-center space-x-2">
              <span>&copy; 2024-2026 考拉健康 KOALA HEALTH</span>
            </div>
            <div class="flex flex-wrap justify-center lg:justify-end items-center gap-x-4 gap-y-2">
              <a href="https://beian.miit.gov.cn/" target="_blank" class="hover:text-blue-500 transition-colors">鲁ICP备2025174251号-1</a>
              <span class="w-1 h-1 bg-blue-500/20 rounded-full"></span>
              <span class="font-bold text-blue-500/20">BUILT BY BITKOALA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router'
// Icons are handled globally by App.vue using lucide.createIcons()
</script>

<style scoped>
.social-icon-btn {
  @apply flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300
         bg-white/5 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/30
         border border-white/10 dark:border-white/5 backdrop-blur-md
         shadow-sm hover:shadow-blue-500/10 hover:border-blue-500/30 text-on-surface-variant/80 hover:text-blue-500;
}
</style>
