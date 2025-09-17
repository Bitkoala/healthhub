<!--
  @file src/views/PomodoroView.vue
  @description 番茄钟功能的主视图容器。
  它的主要职责是提供一个全屏居中的布局，并将核心的 PomodoroTimer 组件渲染到页面上。
-->
<template>
  <div class="pomodoro-view">
    <PomodoroTimer />
  </div>
</template>

<script setup lang="ts">
import PomodoroTimer from '@/components/PomodoroTimer.vue'
</script>

<style scoped>
/**
 * 为番茄钟视图提供一个 flex 布局，
 * 使其内容（PomodoroTimer 组件）在视口中水平和垂直居中。
 */
.pomodoro-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
</style>
