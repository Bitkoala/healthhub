<template>
  <div class="admin-panel p-4 sm:p-6">
    <h1 class="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">{{ $t('admin_title') }}</h1>

    <!-- 功能标签页 -->
    <div class="mb-6 border-b border-gray-200">
      <nav class="-mb-px flex space-x-6" aria-label="Tabs">
        <button
          @click="activeTab = 'userManagement'"
          :class="[
            'px-3 py-2 font-medium text-sm rounded-t-md',
            activeTab === 'userManagement'
              ? 'border-b-2 border-indigo-500 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300',
          ]"
        >
          {{ $t('admin_user_management') }}
        </button>
        <button
          @click="activeTab = 'systemTools'"
          :class="[
            'px-3 py-2 font-medium text-sm rounded-t-md',
            activeTab === 'systemTools'
              ? 'border-b-2 border-indigo-500 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300',
          ]"
        >
          {{ $t('admin_system_tools') }}
        </button>
      </nav>
    </div>

    <!-- 用户管理 -->
    <div v-if="activeTab === 'userManagement'">
      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <div class="p-4">
          <h2 class="text-xl font-semibold text-gray-700">{{ $t('admin_user_list') }}</h2>
          <p class="text-sm text-gray-500 mt-1">{{ $t('admin_user_list_desc') }}</p>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('admin_user_id') }}</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('admin_username') }}</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('admin_email') }}</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('admin_created_at') }}</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('admin_last_login') }}</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('admin_role') }}</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('admin_actions') }}</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="loading">
                <td colspan="7" class="text-center py-4">{{ $t('admin_loading') }}</td>
              </tr>
              <tr v-for="user in users" :key="user.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ user.id }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ user.username || $t('admin_na') }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ user.email || $t('admin_na') }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDateTime(user.created_at) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDateTime(user.last_login_at) || $t('admin_never') }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                   <span :class="['px-2 inline-flex text-xs leading-5 font-semibold rounded-full', user.is_admin === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800']">
                    {{ user.is_admin === 1 ? $t('admin_role_admin') : $t('admin_role_user') }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button @click="handleResetPassword(user.id)" class="text-indigo-600 hover:text-indigo-900 mr-3">{{ $t('admin_reset_password') }}</button>
                  <button @click="handleDeleteUser(user.id, user.username)" class="text-red-600 hover:text-red-900" :disabled="user.is_admin === 1">
                    {{ user.is_admin === 1 ? $t('admin_cannot_delete') : $t('admin_delete') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 系统工具 -->
    <div v-if="activeTab === 'systemTools'">
       <div class="bg-white shadow-md rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-700 mb-4">{{ $t('admin_cleanup_title') }}</h2>
          <p class="text-sm text-gray-500 mb-4" v-html="$t('admin_cleanup_desc')"></p>
          <div class="flex items-center space-x-4">
            <label for="cleanup-days" class="text-sm font-medium text-gray-700">{{ $t('admin_cleanup_prefix') }}</label>
            <input
              type="number"
              v-model.number="cleanupDays"
              id="cleanup-days"
              class="block w-24 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              :placeholder="$t('admin_cleanup_placeholder')"
            />
            <label for="cleanup-days" class="text-sm font-medium text-gray-700">{{ $t('admin_cleanup_suffix') }}</label>
            <button
              @click="handleCleanup"
              :disabled="!cleanupDays || cleanupDays <= 0"
              class="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {{ $t('admin_cleanup_button') }}
            </button>
          </div>
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';
import { useToastStore } from '@/stores/toast';
import { useLanguageStore } from '@/stores/language';

const t = useLanguageStore().t;
const toastStore = useToastStore();

interface User {
  id: number;
  username: string | null;
  email: string | null;
  created_at: string;
  last_login_at: string | null;
  is_admin: number; // 数据库返回 0 或 1
}

const activeTab = ref<'userManagement' | 'systemTools'>('userManagement');
const users = ref<User[]>([]);
const loading = ref(true);
const cleanupDays = ref<number | null>(90);

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await apiRequest('/admin/users');
    users.value = response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    toastStore.showToast({ message: t('admin_toast_fetch_users_error', { message }), type: 'error' });
  } finally {
    loading.value = false;
  }
};

const handleResetPassword = async (userId: number) => {
  if (!confirm(t('admin_confirm_reset_password', { userId }))) return;

  try {
    const response = await apiRequest('/admin/reset-password', 'POST', { userId });
    alert(t('admin_alert_reset_password_success', { userId, newPassword: response.newPassword }));
    toastStore.showToast({ message: response.message, type: 'success' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    toastStore.showToast({ message: t('admin_toast_reset_password_error', { message }), type: 'error' });
  }
};

const handleDeleteUser = async (userId: number, username: string | null) => {
  const finalUsername = username || `ID: ${userId}`;
  if (!confirm(t('admin_confirm_delete_user', { username: finalUsername }))) return;

  try {
    const response = await apiRequest(`/admin/delete-user/${userId}`, 'DELETE');
    toastStore.showToast({ message: response.message, type: 'success' });
    fetchUsers(); // 重新加载用户列表
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    toastStore.showToast({ message: t('admin_toast_delete_user_error', { message }), type: 'error' });
  }
};

const handleCleanup = async () => {
  if (!cleanupDays.value || cleanupDays.value <= 0) {
    toastStore.showToast({ message: t('admin_toast_invalid_days'), type: 'error' });
    return;
  }
  if (!confirm(t('admin_confirm_cleanup', { days: cleanupDays.value }))) return;

  try {
    const response = await apiRequest('/admin/cleanup-inactive-users', 'POST', { days: cleanupDays.value });
    toastStore.showToast({ message: t('admin_toast_cleanup_success', { message: response.message, count: response.cleanedUserIds.length }), type: 'success' });
    fetchUsers(); // 重新加载用户列表
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    toastStore.showToast({ message: t('admin_toast_cleanup_error', { message }), type: 'error' });
  }
};

const formatDateTime = (dateTimeString: string | null) => {
  if (!dateTimeString) return null;
  try {
    const date = new Date(dateTimeString);
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return dateTimeString; // 如果是无效日期，返回原始字符串
    }
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e: unknown) {
    console.error(`Failed to format date: ${dateTimeString}`, e);
    return dateTimeString; // 解析出错则返回原始字符串
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.admin-panel {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
