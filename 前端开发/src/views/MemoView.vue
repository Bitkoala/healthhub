<!--
  @file src/views/MemoView.vue
  @description “备忘录”页面，一个功能丰富的待办事项（To-Do）应用。

  核心功能:
  - **任务管理**: 添加带有优先级（高、中、低）的任务，切换任务的完成状态，以及删除任务。
  - **智能排序**: 任务列表会自动进行排序，规则为：未完成的任务优先于已完成的，同状态下高优先级的任务优先于低优先级的。
  - **视图筛选**: 支持在“待办”、“已完成”、“全部”三种视图之间快速切换，方便用户聚焦于不同状态的任务。
  - **历史搜索**: 提供一个专门的搜索功能，用于在所有已完成的任务中快速查找历史记录。
-->
<script setup lang="ts">
/**
 * @description 备忘录页面的主脚本区域。
 * 负责管理所有备忘录任务的状态，处理增、删、改、查、排序和筛选的逻辑，
 * 以及历史记录的搜索功能。
 */
import { ref, onMounted, computed, nextTick } from 'vue'
import { apiRequest } from '@/api'
import { useToastStore } from '@/stores/toast'

declare const lucide: { createIcons: () => void };

// --- 类型定义 (Interfaces) ---
interface Memo {
  id: number;
  task_name: string;
  priority: 'high' | 'medium' | 'low';
  is_completed: boolean;
  created_at: string;
  completed_at: string | null;
}

// --- 响应式状态 (State) ---
const { showToast } = useToastStore()
const allMemos = ref<Memo[]>([]) // 存储从后端获取的所有备忘录任务
const newMemo = ref({ task_name: '', priority: 'medium' as 'high' | 'medium' | 'low' }) // 新建备忘录的表单数据
const filter = ref<'pending' | 'completed' | 'all'>('pending') // 当前的筛选条件
const historySearchQuery = ref('') // 历史记录搜索的关键词
const historySearchResults = ref<Memo[]>([]) // 历史记录搜索结果
const isSearching = ref(false) // 是否正在执行搜索

// --- 计算属性与常量 (Computed & Constants) ---

// 优先级映射，用于显示文本和颜色
const priorityMap = {
  high: { text: '高', color: 'bg-red-500', border: 'border-red-500' },
  medium: { text: '中', color: 'bg-yellow-500', border: 'border-yellow-500' },
  low: { text: '低', color: 'bg-blue-500', border: 'border-blue-500' },
}

/**
 * @computed filteredMemos
 * @description 根据当前 `filter` 的值（'pending', 'completed', 'all'），
 * 从 `allMemos` 数组中计算出需要显示在界面上的任务列表。
 * @returns {Memo[]} 筛选后的任务数组。
 */
const filteredMemos = computed(() => {
  let memos = allMemos.value
  if (filter.value === 'pending') {
    memos = memos.filter((memo) => !memo.is_completed)
  }
  if (filter.value === 'completed') {
    memos = memos.filter((memo) => memo.is_completed)
  }
  return memos
})

// --- 方法 (Methods) ---

/**
 * @function loadMemos
 * @description 从API加载当前用户的所有备忘录任务。
 */
const loadMemos = async () => {
  try {
    allMemos.value = await apiRequest('/memos')
    nextTick(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons()
    })
  } catch (error) {
    if (error instanceof Error) {
      showToast({ message: `加载备忘录失败: ${error.message}`, type: 'error' })
    }
  }
}

/**
 * @function sortMemos
 * @description 对 `allMemos` 列表进行原地排序。
 * 排序核心规则：
 * 1. **按完成状态**: 未完成的 (`is_completed: false`) 任务排在已完成的 (`is_completed: true`) 任务之前。
 * 2. **按优先级**: 在相同完成状态下，按“高 -> 中 -> 低”的优先级进行排序。
 */
const sortMemos = () => {
  allMemos.value.sort((a: Memo, b: Memo) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 }
    // 未完成的在前
    if (a.is_completed !== b.is_completed) {
      return (a.is_completed ? 1 : 0) - (b.is_completed ? 1 : 0)
    }
    // 按优先级排序
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

/**
 * @function addMemo
 * @description 添加一个新的备忘录任务。
 * 成功后，会将新任务添加到列表顶部，重新排序，并清空输入框。
 */
const addMemo = async () => {
  if (!newMemo.value.task_name.trim()) {
    showToast({ message: '任务内容不能为空', type: 'error' })
    return
  }
  try {
    const addedMemo = await apiRequest('/memos', 'POST', newMemo.value)
    allMemos.value.unshift(addedMemo)
    sortMemos() // 排序
    newMemo.value = { task_name: '', priority: 'medium' }
    showToast({ message: '任务已添加', type: 'success' })
  } catch (error) {
    if (error instanceof Error) {
      showToast({ message: `添加失败: ${error.message}`, type: 'error' })
    }
  }
}

/**
 * @function toggleMemoStatus
 * @description 切换指定备忘录任务的完成状态。
 * 状态更新后，会立即调用 `sortMemos` 重新排序列表。
 * @param {Memo} memo - 要操作的备忘录对象。
 */
const toggleMemoStatus = async (memo: Memo) => {
  try {
    const newStatus = !memo.is_completed
    await apiRequest(`/memos/${memo.id}/status`, 'PUT', { is_completed: newStatus })
    memo.is_completed = newStatus
    memo.completed_at = newStatus ? new Date().toISOString() : null // 立即更新完成时间
    sortMemos() // 状态改变后重新排序
  } catch (error) {
    if (error instanceof Error) {
      showToast({ message: `更新状态失败: ${error.message}`, type: 'error' })
    }
  }
}

/**
 * @function deleteMemo
 * @description 删除一个指定的备忘录任务。
 * @param {Memo} memo - 要删除的备忘录对象。
 */
const deleteMemo = async (memo: Memo) => {
  if (confirm(`确定要删除任务 "${memo.task_name}" 吗？`)) {
    try {
      await apiRequest(`/memos/${memo.id}`, 'DELETE')
      allMemos.value = allMemos.value.filter((m) => m.id !== memo.id)
      showToast({ message: '任务已删除', type: 'success' })
    } catch (error) {
      if (error instanceof Error) {
        showToast({ message: `删除失败: ${error.message}`, type: 'error' })
      }
    }
  }
}

/**
 * @function searchHistory
 * @description 根据 `historySearchQuery` 的值，调用API在已完成的备忘录中进行模糊搜索。
 */
const searchHistory = async () => {
  if (!historySearchQuery.value.trim()) {
    historySearchResults.value = []
    return
  }
  isSearching.value = true
  try {
    const results = await apiRequest(
      `/memos/history/search?q=${encodeURIComponent(historySearchQuery.value)}`,
    )
    historySearchResults.value = results
  } catch (error) {
    if (error instanceof Error) {
      showToast({ message: '搜索失败: ' + error.message, type: 'error' })
    }
  } finally {
    isSearching.value = false
  }
}

// --- 生命周期钩子 (Lifecycle Hooks) ---
/**
 * @description 组件挂载后，立即调用 `loadMemos` 加载初始的备忘录数据。
 */
onMounted(loadMemos)
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-3xl">
    <header class="mb-6">
      <div class="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl shadow border border-white/20">
        <h1 class="text-2xl font-bold">备忘录</h1>
        <p class="text-gray-500 mt-1">记录和管理您的待办事项</p>
      </div>
    </header>

    <!-- 添加任务表单 -->
    <div class="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-md mb-6 border border-white/20">
      <form @submit.prevent="addMemo" class="space-y-4">
        <input
          type="text"
          v-model="newMemo.task_name"
          placeholder="需要做什么？"
          class="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
        />
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <label class="flex items-center"
              ><input
                type="radio"
                v-model="newMemo.priority"
                value="high"
                class="mr-1 text-red-500 focus:ring-red-500"
              />
              <span class="text-red-600 font-semibold">高</span></label
            >
            <label class="flex items-center"
              ><input
                type="radio"
                v-model="newMemo.priority"
                value="medium"
                class="mr-1 text-yellow-500 focus:ring-yellow-500"
              />
              <span class="text-yellow-600 font-semibold">中</span></label
            >
            <label class="flex items-center"
              ><input
                type="radio"
                v-model="newMemo.priority"
                value="low"
                class="mr-1 text-blue-500 focus:ring-blue-500"
              />
              <span class="text-blue-600 font-semibold">低</span></label
            >
          </div>
          <button
            type="submit"
            class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md"
          >
            添加任务
          </button>
        </div>
      </form>
    </div>

    <!-- 筛选和列表 -->
    <main class="mb-8">
      <div
        class="flex items-center justify-between bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-md mb-6 border border-white/20"
      >
        <button
          @click="filter = 'pending'"
          :class="{ 'bg-blue-500 text-white': filter === 'pending' }"
          class="flex-1 py-2 px-4 rounded-lg"
        >
          待办
        </button>
        <button
          @click="filter = 'completed'"
          :class="{ 'bg-blue-500 text-white': filter === 'completed' }"
          class="flex-1 py-2 px-4 rounded-lg"
        >
          已完成
        </button>
        <button
          @click="filter = 'all'"
          :class="{ 'bg-blue-500 text-white': filter === 'all' }"
          class="flex-1 py-2 px-4 rounded-lg"
        >
          全部
        </button>
      </div>

      <div
        v-if="filteredMemos.length === 0"
        class="text-center py-12 bg-white/60 backdrop-blur-sm rounded-xl"
      >
        <p>太棒了！当前分类下没有任务。</p>
      </div>
      <div class="space-y-3">
        <div
          v-for="memo in filteredMemos"
          :key="memo.id"
          class="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm flex items-start justify-between border-l-4"
          :class="priorityMap[memo.priority].border"
        >
          <div class="flex items-start">
            <input
              type="checkbox"
              :checked="memo.is_completed"
              @change="toggleMemoStatus(memo)"
              class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-4 mt-1"
            />
            <div>
              <span :class="{ 'line-through text-gray-400': memo.is_completed }">{{
                memo.task_name
              }}</span>
              <div class="flex items-center text-xs text-gray-500 mt-1">
                <span
                  class="w-3 h-3 rounded-full mr-1"
                  :class="priorityMap[memo.priority].color"
                ></span>
                <span>优先级: {{ priorityMap[memo.priority].text }}</span>
                <template v-if="memo.is_completed && memo.completed_at">
                  <span class="mx-2">|</span>
                  <span>完成于: {{ new Date(memo.completed_at).toLocaleString('zh-CN') }}</span>
                </template>
              </div>
            </div>
          </div>
          <button
            @click="deleteMemo(memo)"
            class="text-xs bg-red-100 text-red-600 hover:bg-red-200 rounded-full px-2 py-1 font-semibold transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    </main>

    <!-- 历史记录查询 -->
    <div>
      <div
        class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md mb-4 border border-white/20"
      >
        <h2 class="text-xl font-semibold">查询已完成的任务</h2>
      </div>
      <form @submit.prevent="searchHistory" class="flex items-center space-x-2 mb-4">
        <input
          type="text"
          v-model="historySearchQuery"
          placeholder="输入关键词搜索..."
          class="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
        />
        <button
          type="submit"
          class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md"
        >
          搜索
        </button>
      </form>
      <main class="space-y-3">
        <div v-if="isSearching" class="text-center py-8 bg-white/60 backdrop-blur-sm rounded-xl">
          <p>正在搜索...</p>
        </div>
        <div
          v-else-if="historySearchResults.length === 0"
          class="text-center py-8 bg-white/60 backdrop-blur-sm rounded-xl"
        >
          <p>{{ historySearchQuery ? '没有找到匹配的已完成记录' : '输入关键词以查询历史' }}</p>
        </div>
        <div
          v-for="result in historySearchResults"
          :key="result.id"
          class="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm border-l-4"
          :class="priorityMap[result.priority].border"
        >
          <p class="font-semibold line-through text-gray-500">{{ result.task_name }}</p>
          <p v-if="result.completed_at" class="text-sm text-gray-600">
            完成于: {{ new Date(result.completed_at).toLocaleString('zh-CN') }}
          </p>
        </div>
      </main>
    </div>

  </div>
</template>
