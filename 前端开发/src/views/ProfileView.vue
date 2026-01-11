<template>
  <div class="min-h-screen pt-32 pb-48 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto space-y-8">
      <!-- Header Section -->
      <div class="animate-fade-in text-center space-y-4 mb-12">
        <div class="inline-block relative">
          <div class="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl rounded-full opacity-50"></div>
          <h1 class="relative text-4xl font-black text-on-surface tracking-tighter sm:text-5xl">
            {{ userStore.user?.username }}
          </h1>
        </div>
        <p class="text-on-surface-variant font-medium tracking-wide uppercase text-xs opacity-60">
          {{ userStore.user?.email }}
        </p>
      </div>

      <!-- Settings Card -->
      <div class="glass-card overflow-hidden animate-slide-up" style="animation-delay: 0.1s">
        <div class="p-8 space-y-10">
          <!-- Section: App Settings -->
          <section class="space-y-6">
            <div class="flex items-center space-x-3">
              <i data-lucide="settings" class="w-5 h-5 text-blue-500/60"></i>
              <h3 class="text-sm font-bold uppercase tracking-widest text-on-surface/80">应用偏好</h3>
            </div>
            <div class="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
              <div class="space-y-1">
                <span class="text-sm font-bold text-on-surface">显示女性健康模块</span>
                <p class="text-[10px] text-on-surface-variant/60 uppercase tracking-wider">控制侧边栏和主页是否显示经期与健康追踪</p>
              </div>
              <button
                @click="toggleWomensHealth"
                role="switch"
                :aria-checked="userStore.user?.show_womens_health"
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                :class="userStore.user?.show_womens_health ? 'bg-blue-600' : 'bg-white/10'"
              >
                <span
                  aria-hidden="true"
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out"
                  :class="userStore.user?.show_womens_health ? 'translate-x-5' : 'translate-x-0'"
                ></span>
              </button>
            </div>
          </section>

          <div class="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          <!-- Section: Personal Info -->
          <section class="space-y-6">
            <div class="flex items-center space-x-3">
              <i data-lucide="user" class="w-5 h-5 text-blue-500/60"></i>
              <h3 class="text-sm font-bold uppercase tracking-widest text-on-surface/80">账号资料</h3>
            </div>
            <form @submit.prevent="updateProfile" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label for="username" class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">用户名</label>
                <div class="relative group">
                  <i data-lucide="at-sign" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-blue-500 transition-colors"></i>
                  <input type="text" id="username" v-model="profileForm.username" class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all">
                </div>
              </div>
              <div class="space-y-2">
                <label for="email" class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">电子邮箱</label>
                <div class="relative group">
                  <i data-lucide="mail" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-blue-500 transition-colors"></i>
                  <input type="email" id="email" v-model="profileForm.email" class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all">
                </div>
              </div>
              <div class="md:col-span-2 pt-4">
                <button type="submit" :disabled="profileLoading" class="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale">
                  {{ profileLoading ? '同步中...' : '提交更改' }}
                </button>
              </div>
            </form>
            <p v-if="profileMessage" class="text-center text-xs font-bold mt-4" :class="profileError ? 'text-red-400' : 'text-emerald-400'">{{ profileMessage }}</p>
          </section>

          <div class="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-10"></div>
          <!-- Section: Password -->
          <section class="space-y-6">
            <div class="flex items-center space-x-3">
              <i data-lucide="lock" class="w-5 h-5 text-amber-500/60"></i>
              <h3 class="text-sm font-bold uppercase tracking-widest text-on-surface/80">
                {{ userStore.user?.has_password ? '修改安全密码' : '设置本地登录密码' }}
              </h3>
            </div>
            <form @submit.prevent="changePassword" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div v-if="userStore.user?.has_password" class="space-y-2">
                  <label for="oldPassword" class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">当前密码</label>
                  <input type="password" id="oldPassword" v-model="passwordForm.oldPassword" required class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all">
                </div>
                <div class="space-y-2" :class="!userStore.user?.has_password ? 'md:col-span-2' : ''">
                  <label for="newPassword" class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">新密码</label>
                  <input type="password" id="newPassword" v-model="passwordForm.newPassword" required class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all">
                </div>
              </div>
              <button type="submit" :disabled="passwordLoading" class="w-full py-4 border border-blue-500/30 text-blue-500 bg-blue-500/5 hover:bg-blue-500/10 font-bold rounded-2xl transition-all active:scale-[0.98]">
                {{ passwordLoading ? '正在验证...' : (userStore.user?.has_password ? '更新安全凭证' : '保存本地密码') }}
              </button>
            </form>
            <p v-if="passwordMessage" class="text-center text-xs font-bold" :class="passwordError ? 'text-red-400' : 'text-emerald-400'">{{ passwordMessage }}</p>
          </section>

          <!-- Danger Zone -->
          <div class="pt-8 flex flex-col items-center border-t border-white/10 px-4">
             <button @click="handleLogout" class="group flex items-center space-x-3 text-red-500/60 hover:text-red-500 font-bold transition-all">
               <i data-lucide="log-out" class="w-5 h-5 group-hover:-translate-x-1 transition-transform"></i>
               <span class="text-sm uppercase tracking-[0.2em]">{{ $t('logout') }}</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { ref, reactive, watch } from 'vue';
import { apiRequest } from '@/api';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

// --- Profile Form State ---
const profileForm = reactive({
  username: userStore.user?.username || '',
  email: userStore.user?.email || '',
});
const profileLoading = ref(false);
const profileMessage = ref('');
const profileError = ref(false);

// --- Password Form State ---
const passwordForm = ref({ oldPassword: '', newPassword: '' });
const passwordLoading = ref(false);
const passwordMessage = ref('');
const passwordError = ref(false);

// Watch for changes in the store and update local form refs
watch(() => userStore.user, (newUser) => {
  if (newUser) {
    profileForm.username = newUser.username || '';
    profileForm.email = newUser.email || '';
  }
}, { immediate: true });

// --- Methods ---
const updateProfile = async () => {
  profileLoading.value = true;
  profileMessage.value = '';
  profileError.value = false;
  try {
    const updatedUser = await apiRequest('/auth/me', 'PUT', profileForm);
    userStore.setUser(updatedUser); // Update the store with the new user data
    profileMessage.value = '个人资料更新成功！';
  } catch (error) {
    profileError.value = true;
    if (error instanceof Error) {
      profileMessage.value = `更新失败: ${error.message}`;
    } else {
      profileMessage.value = '更新时发生未知错误';
    }
  } finally {
    profileLoading.value = false;
  }
};

const changePassword = async () => {
  passwordLoading.value = true;
  passwordMessage.value = '';
  passwordError.value = false;
  try {
    await apiRequest('/auth/me/password', 'PUT', passwordForm.value);
    passwordMessage.value = '密码更新成功！'; // 直接使用成功消息，因为后端成功时不返回消息体
    passwordForm.value = { oldPassword: '', newPassword: '' }; // Clear form
  } catch (error) {
    passwordError.value = true;
    if (error instanceof Error) {
      passwordMessage.value = `密码修改失败: ${error.message}`;
    } else {
      passwordMessage.value = '修改密码时发生未知错误';
    }
  } finally {
    passwordLoading.value = false;
  }
};

const handleLogout = () => {
  userStore.logout();
  router.push({ name: 'Login' });
};

const toggleWomensHealth = async () => {
  if (userStore.user) {
    try {
      const currentSetting = !!userStore.user.show_womens_health;
      await userStore.updateShowWomensHealth(!currentSetting);
      // You can add a success toast here if you want
    } catch (error) {
      // You can add an error toast here
      console.error("Failed to update setting:", error);
    }
  }
};
</script>
