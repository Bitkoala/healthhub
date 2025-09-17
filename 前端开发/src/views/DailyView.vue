<template>
  <div class="container mx-auto p-4 md:p-6 max-w-4xl">
    <header class="mb-6">
      <div class="inline-block bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow">
        <h1 class="text-2xl font-bold">每日清单</h1>
        <p class="text-gray-500 mt-1">追踪您的每日习惯与一次性任务</p>
      </div>
    </header>

    <main class="space-y-6">
      <!-- 管理区域 -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold">任务管理</h2>
          <button
            @click="isManaging = !isManaging"
            class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
          >
            {{ isManaging ? '完成' : '添加 / 管理' }}
          </button>
        </div>
        <div v-if="isManaging" class="mt-4 border-t pt-4">
          <form @submit.prevent="handleAddItem" class="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              v-model="newItemName"
              type="text"
              placeholder="输入新任务名称..."
              class="flex-grow px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              v-model="newItemType"
              class="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">每日任务</option>
              <option value="one-time">一次性任务</option>
            </select>
            <button
              type="submit"
              class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
            >
              添加
            </button>
          </form>
        </div>
      </div>

      <!-- 任务列表区域 -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow">
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4"
        >
          <h2 class="text-xl font-semibold">今日任务</h2>
          <input
            type="date"
            v-model="selectedDate"
            class="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- 每日任务 -->
        <div v-if="dailyTasks.length > 0">
          <h3 class="text-lg font-semibold mb-2 text-gray-700">每日任务</h3>
          <ul class="space-y-2">
            <li
              v-for="item in dailyTasks"
              :key="item.id"
              class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <span>{{ item.item_name }}</span>
              <div class="flex items-center gap-2">
                <template v-if="getLogStatus(item.item_name) === 'pending'">
                  <button
                    @click="updateLogStatus(item.item_name, 'completed')"
                    class="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-full transition-all"
                  >
                    完成
                  </button>
                  <button
                    @click="updateLogStatus(item.item_name, 'skipped')"
                    class="text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-full transition-all"
                  >
                    跳过
                  </button>
                </template>
                <template v-else>
                  <span
                    :class="
                      getLogStatus(item.item_name) === 'completed'
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    "
                    class="text-sm font-semibold"
                  >
                    {{ getLogStatus(item.item_name) === 'completed' ? '今日已完成' : '今日已跳过' }}
                  </span>
                  <button
                    @click="updateLogStatus(item.item_name, 'pending')"
                    class="text-xs text-gray-500 hover:text-gray-700"
                  >
                    撤销
                  </button>
                </template>
                <button
                  v-if="isManaging"
                  @click="handleDeleteItem(item)"
                  class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded-full transition-all"
                >
                  删除
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- 一次性任务 -->
        <div v-if="oneTimeTasks.length > 0" class="mt-4">
          <h3 class="text-lg font-semibold mb-2 text-gray-700">一次性任务</h3>
          <ul class="space-y-2">
            <li
              v-for="item in oneTimeTasks"
              :key="item.id"
              class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <span :class="{ 'line-through text-gray-400': item.status === 'completed' }">{{
                item.item_name
              }}</span>
              <div class="flex items-center gap-2">
                <span
                  v-if="item.status === 'completed'"
                  class="text-sm font-semibold text-green-600"
                  >已完成</span
                >
                <button
                  v-else
                  @click="completeOneTimeTask(item)"
                  class="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-full transition-all"
                >
                  完成
                </button>
                <button
                  v-if="isManaging"
                  @click="handleDeleteItem(item)"
                  class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded-full transition-all"
                >
                  删除
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div
          v-if="!isLoading && dailyTasks.length === 0 && oneTimeTasks.length === 0"
          class="text-center py-8 text-gray-500"
        >
          <p>暂无任务项目。</p>
          <p>点击 "添加 / 管理" 来创建您的第一个任务吧！</p>
        </div>
      </div>

      <!-- 历史记录查询 -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow">
        <h2 class="text-xl font-semibold mb-4">历史记录查询</h2>
        <div class="flex gap-2">
          <input
            type="text"
            v-model="searchQuery"
            @keyup.enter="searchHistory"
            placeholder="输入关键词搜索历史..."
            class="flex-grow px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            @click="searchHistory"
            class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
          >
            搜索
          </button>
        </div>
        <div v-if="isSearching" class="text-center py-4">正在搜索...</div>
        <ul v-if="searchResults.length > 0" class="mt-4 space-y-2">
          <li v-for="log in searchResults" :key="log.id" class="p-3 bg-gray-50 rounded-lg text-sm">
            <span class="font-semibold">{{ new Date(log.log_date).toLocaleDateString() }}</span> -
            <span>{{ log.item_name }}</span
            >:
            <span
              class="font-medium"
              :class="log.status === 'completed' ? 'text-green-600' : 'text-yellow-600'"
              >{{ log.status === 'completed' ? '已完成' : '已跳过' }}</span
            >
            <p v-if="log.notes" class="text-xs text-gray-500 mt-1 pl-2 border-l-2">
              {{ log.notes }}
            </p>
          </li>
        </ul>
        <p
          v-if="!isSearching && searchResults.length === 0 && hasSearched"
          class="mt-4 text-center text-gray-500"
        >
          未找到相关记录。
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * @file src/views/DailyView.vue
 * @description “每日清单”页面，用于追踪每日重复性习惯和一次性任务。
 *
 * 功能：
 * - 区分“每日任务”和“一次性任务”。
 * - 允许用户添加和删除任务项。
 * - 用户可以按日期查看每日任务的完成状态（完成、跳过、待定）。
 * - 用户可以标记一次性任务为完成。
 * - 提供历史记录搜索功能。
 * - 使用一个全局的 toast 组件来显示操作反馈。
 */
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { apiRequest } from '../api'
import { useToastStore } from '@/stores/toast'

declare const lucide: { createIcons: () => void };

/**
 * @interface DailyItem
 * @description 定义任务项的数据结构。
 */
interface DailyItem {
  id: number;
  item_name: string;
  item_type: 'daily' | 'one-time';
  status?: 'completed';
}

/**
 * @interface DailyLog
 * @description 定义任务日志的数据结构。
 */
interface DailyLog {
  id: number;
  item_name: string;
  log_date: string;
  status: 'completed' | 'skipped';
  notes?: string;
}

/**
 * @interface DailyLogMap
 * @description 用于快速查找当天日志的哈希表，键为任务名。
 */
interface DailyLogMap {
  [itemName: string]: DailyLog;
}

// --- 响应式状态 (State) ---
const isLoading = ref(true)
const isManaging = ref(false)
const dailyItems = ref<DailyItem[]>([])
const dailyLogs = ref<DailyLogMap>({})
const selectedDate = ref(new Date().toISOString().split('T')[0])
const newItemName = ref('')
const newItemType = ref<'daily' | 'one-time'>('daily')
const searchQuery = ref('')
const searchResults = ref<DailyLog[]>([])
const isSearching = ref(false)
const hasSearched = ref(false)
const toastStore = useToastStore()

// --- 计算属性 (Computed Properties) ---

/**
 * @computed dailyTasks
 * @description 从任务项总列表中筛选出“每日任务”。
 */
const dailyTasks = computed(() => {
  return (Array.isArray(dailyItems.value) ? dailyItems.value : []).filter(
    (item) => item.item_type === 'daily',
  )
})

/**
 * @computed oneTimeTasks
 * @description 从任务项总列表中筛选出“一次性任务”。
 */
const oneTimeTasks = computed(() => {
  return (Array.isArray(dailyItems.value) ? dailyItems.value : []).filter(
    (item) => item.item_type === 'one-time',
  )
})

// --- 数据加载与操作方法 (Methods) ---

/**
 * @function loadAllData
 * @description 页面初始化时调用，并行加载所有任务项和当天的日志。
 */
const loadAllData = async () => {
  isLoading.value = true
  try {
    await Promise.all([loadItems(), loadLogsForDate(selectedDate.value)])
  } catch (e) {
    toastStore.showToast({ message: `加载初始数据失败: ${(e as Error).message}`, type: 'error' })
  } finally {
    isLoading.value = false
  }
}

/**
 * @function loadItems
 * @description 从 API 加载所有已定义的任务项（每日和一次性）。
 */
const loadItems = async () => {
  try {
    const responseData = await apiRequest('/daily-logs/items')
    dailyItems.value = Array.isArray(responseData) ? responseData : []
  } catch (e) {
    toastStore.showToast({ message: `获取清单项目失败: ${(e as Error).message}`, type: 'error' })
    dailyItems.value = []
  }
}

/**
 * @function loadLogsForDate
 * @description 从 API 加载指定日期的所有任务日志。
 * @param {string} date - 'YYYY-MM-DD' 格式的日期字符串。
 */
const loadLogsForDate = async (date: string) => {
  try {
    const logs = await apiRequest(`/daily-logs/logs/${date}`)
    dailyLogs.value = (Array.isArray(logs) ? logs : []).reduce((acc, log) => {
      acc[log.item_name] = log
      return acc
    }, {})
  } catch (e) {
    toastStore.showToast({ message: `获取当日记录失败: ${(e as Error).message}`, type: 'error' })
    dailyLogs.value = {}
  }
}

/**
 * @function getLogStatus
 * @description 检查 `dailyLogs` 映射，返回指定任务在当天的状态。
 * @param {string} itemName - 任务名称。
 * @returns {'completed' | 'skipped' | 'pending'} - 任务状态。
 */
const getLogStatus = (itemName: string): 'completed' | 'skipped' | 'pending' => {
  return dailyLogs.value[itemName]?.status || 'pending'
}

/**
 * @function updateLogStatus
 * @description 向 API 发送请求，更新或创建每日任务在当天的日志状态。
 * @param {string} itemName - 任务名称。
 * @param {'completed' | 'skipped' | 'pending'} status - 新的状态。
 */
const updateLogStatus = async (itemName: string, status: 'completed' | 'skipped' | 'pending') => {
  const logData = {
    log_date: selectedDate.value,
    item_name: itemName,
    status: status,
    notes: dailyLogs.value[itemName]?.notes || '',
  }
  try {
    await apiRequest('/daily-logs/logs', 'POST', logData)
    await loadLogsForDate(selectedDate.value)
  } catch (e) {
    toastStore.showToast({ message: `更新状态失败: ${(e as Error).message}`, type: 'error' })
  }
}

/**
 * @function completeOneTimeTask
 * @description 向 API 发送请求，将一个一次性任务的状态标记为“完成”。
 * @param {DailyItem} item - 要完成的任务项对象。
 */
const completeOneTimeTask = async (item: DailyItem) => {
  try {
    await apiRequest(`/daily-logs/items/${item.id}/complete`, 'PUT')
    toastStore.showToast({ message: `任务 "${item.item_name}" 已完成!`, type: 'success' })
    const taskIndex = dailyItems.value.findIndex((t) => t.id === item.id)
    if (taskIndex !== -1) {
      dailyItems.value[taskIndex].status = 'completed'
    }
  } catch (e) {
    toastStore.showToast({ message: `操作失败: ${(e as Error).message}`, type: 'error' })
  }
}

/**
 * @function handleAddItem
 * @description 处理用户提交新任务表单的逻辑。
 */
const handleAddItem = async () => {
  if (!newItemName.value.trim()) {
    toastStore.showToast({ message: '任务名称不能为空', type: 'error' })
    return
  }
  try {
    const newItem = {
      item_name: newItemName.value.trim(),
      item_type: newItemType.value,
    }
    const addedItem = await apiRequest('/daily-logs/items', 'POST', newItem)
    dailyItems.value.push(addedItem)
    newItemName.value = ''
    toastStore.showToast({ message: '新任务已添加', type: 'success' })
  } catch (e) {
    toastStore.showToast({ message: `添加失败: ${(e as Error).message}`, type: 'error' })
  }
}

/**
 * @function handleDeleteItem
 * @description 处理删除任务项的逻辑。会向用户确认，并同时删除所有相关的历史记录。
 * @param {DailyItem} itemToDelete - 要删除的任务项对象。
 */
const handleDeleteItem = async (itemToDelete: DailyItem) => {
  if (
    confirm(`确定要删除任务 "${itemToDelete.item_name}" 吗？\n这将同时删除所有相关的历史记录。`)
  ) {
    try {
      await apiRequest(`/daily-logs/items/${itemToDelete.id}`, 'DELETE')
      await loadAllData() // Reload all data for consistency
      toastStore.showToast({ message: '任务已删除', type: 'success' })
    } catch (e) {
      toastStore.showToast({ message: `删除失败: ${(e as Error).message}`, type: 'error' })
    }
  }
}

/**
 * @function searchHistory
 * @description 根据输入框中的关键词，向 API 请求相关的历史日志。
 */
const searchHistory = async () => {
  if (!searchQuery.value.trim()) return
  isSearching.value = true
  hasSearched.value = true
  try {
    const data = await apiRequest(
      `/daily-logs/history/search?q=${encodeURIComponent(searchQuery.value.trim())}`,
    )
    searchResults.value = Array.isArray(data) ? data : []
  } catch (e) {
    toastStore.showToast({ message: `搜索失败: ${(e as Error).message}`, type: 'error' })
    searchResults.value = [];
  } finally {
    isSearching.value = false
  }
}

// --- 生命周期钩子 (Lifecycle Hooks) & 侦听器 (Watchers) ---

onMounted(() => {
  loadAllData()
})

// 侦听 `selectedDate` 的变化。当用户选择一个新日期时，自动加载该日期的日志。
watch(selectedDate, (newDate) => {
  loadLogsForDate(newDate)
})

// 侦听多个状态的变化。当管理状态切换或数据列表更新时，
// 调用 `nextTick` 以确保 DOM 更新完毕，然后重新渲染 Lucide 图标。
watch(
  [isManaging, dailyItems, dailyLogs],
  () => {
    nextTick(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons()
      }
    })
  },
  { deep: true },
)
</script>
