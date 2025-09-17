<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
    <div class="max-w-md md:max-w-2xl w-full bg-white rounded-xl shadow-md overflow-hidden">
      <div class="p-8">
          <!-- User Info -->
          <div class="text-center">
            <h2 class="mt-4 text-2xl font-bold text-gray-900">{{ userStore.user?.username }}</h2>
            <p class="mt-1 text-md text-gray-500">{{ userStore.user?.email }}</p>
          </div>

          <hr class="my-6">

          <!-- App Settings -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">应用设置</h3>
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span class="text-sm font-medium text-gray-700">显示女性健康模块</span>
              <button
                @click="toggleWomensHealth"
                role="switch"
                :aria-checked="userStore.user?.show_womens_health"
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                :class="userStore.user?.show_womens_health ? 'bg-green-600' : 'bg-gray-300'"
              >
                <span
                  aria-hidden="true"
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  :class="userStore.user?.show_womens_health ? 'translate-x-5' : 'translate-x-0'"
                ></span>
              </button>
            </div>
          </div>

          <hr class="my-6">

          <!-- Update Profile Form -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">更新个人资料</h3>
            <form @submit.prevent="updateProfile" class="space-y-4">
              <div>
                <label for="username" class="block text-sm font-medium text-gray-700">用户名</label>
                <input type="text" id="username" v-model="profileForm.username" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
              </div>
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">邮箱</label>
                <input type="email" id="email" v-model="profileForm.email" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
              </div>
              <button type="submit" :disabled="profileLoading" class="w-full px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                {{ profileLoading ? '正在保存...' : '保存资料' }}
              </button>
            </form>
            <p v-if="profileMessage" class="mt-2 text-sm" :class="profileError ? 'text-red-600' : 'text-green-600'">{{ profileMessage }}</p>
          </div>

          <hr class="my-6">

          <!-- Change Password Form -->
          <div v-if="userStore.user?.has_password">
            <h3 class="text-lg font-medium text-gray-900 mb-4">修改密码</h3>
            <form @submit.prevent="changePassword" class="space-y-4">
              <div>
                <label for="oldPassword" class="block text-sm font-medium text-gray-700">旧密码</label>
                <input type="password" id="oldPassword" v-model="passwordForm.oldPassword" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
              </div>
              <div>
                <label for="newPassword" class="block text-sm font-medium text-gray-700">新密码 (至少6位)</label>
                <input type="password" id="newPassword" v-model="passwordForm.newPassword" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
              </div>
              <button type="submit" :disabled="passwordLoading" class="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                {{ passwordLoading ? '正在提交...' : '确认修改' }}
              </button>
            </form>
            <p v-if="passwordMessage" class="mt-2 text-sm" :class="passwordError ? 'text-red-600' : 'text-green-600'">{{ passwordMessage }}</p>
          </div>
          <div v-else class="mt-6 p-4 bg-gray-100 rounded-lg">
            <p class="text-sm text-gray-700">您通过第三方服务登录，无需设置或更改密码。</p>
          </div>

          <!-- Logout -->
          <div class="mt-8">
            <button @click="handleLogout" class="w-full px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700">
              退出登录
            </button>
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
    const updatedUser = await apiRequest('/me', 'PUT', profileForm);
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
    await apiRequest('/me/password', 'PUT', passwordForm.value);
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
