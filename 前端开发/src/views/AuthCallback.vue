<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center p-4">
      <p class="text-lg font-semibold">正在验证您的身份...</p>
      <!-- 用于在开发时显示流程步骤 -->
      <p v-if="debugMessage" class="mt-4 p-2 bg-blue-100 text-blue-800 text-xs rounded break-all">{{ debugMessage }}</p>
      <!-- 向用户显示的错误信息 -->
      <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file src/views/AuthCallback.vue
 * @description OAuth 认证回调页面。
 *
 * 此页面是第三方认证流程的终点。当用户在外部服务（如 Linux.do）完成授权后，
 * 会被重定向到此页面，URL 中会附带认证令牌 (token) 或错误信息。
 *
 * 主要职责：
 * 1. 解析 URL 查询参数，提取 `token` 或 `error`。
 * 2. 如果有 `token`，则将其保存到 `localStorage` 中。
 * 3. 保存成功后，重定向到应用首页 (`/`)，完成登录流程。
 * 4. 如果有 `error` 或缺少 `token`，则向用户显示相应的错误信息。
 */
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const error = ref<string>('');
const debugMessage = ref<string>(''); // 用于在开发环境中显示流程步骤

onMounted(() => {
  const token = route.query.token;
  const loginError = route.query.error;

  debugMessage.value = `[1/3] Callback page loaded. Token found: [${token ? 'Yes' : 'No'}], Error found: [${loginError || 'No'}]`;

  // --- 认证流程处理 ---

  // 情况 1: URL 中明确包含错误信息。
  if (loginError) {
    error.value = '第三方登录失败，请重试。';
    debugMessage.value += ' | OAuth provider returned an error.';
    return;
  }

  // 情况 2: 成功从 URL 中获取到 Token。
  if (token && typeof token === 'string') {
    debugMessage.value += ' | [2/3] Token found, attempting to save to localStorage...';
    try {
      localStorage.setItem('authToken', token);
      debugMessage.value += ' | [3/3] Save successful! Redirecting to home...';
      // 延迟后跳转到首页。使用 `window.location.href` 会强制刷新页面，
      // 这有助于确保整个 Vue 应用重新初始化，并正确识别新的登录状态。
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch {
      error.value = '存储认证信息失败。您的浏览器可能已禁用 localStorage 或处于隐私模式。';
      debugMessage.value += ' | Save failed!';
    }
    return;
  }

  // 情况 3: URL 中既没有 Token 也没有错误信息，这是一个无效的回调。
  error.value = '无效的回调链接。未找到认证信息，请返回登录页重试。';
});
</script>
