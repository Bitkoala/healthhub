<!--
  @file src/views/MedicationView.vue
  @description “用药记录”页面，一个用于管理用户用药计划和服药历史的综合工具。

  核心功能:
  - **用药计划管理**: 支持添加和删除用药计划，包含药品名称、用量、每日次数、具体的服药时间点以及库存量。
  - **动态表单**: 添加药品时，“服药时间”输入框的数量会根据“每日次数”的设置动态增减，提升用户体验。
  - **库存与日志**:
    - “服用”操作会自动扣减相应库存并生成一条服药日志。
    - “补充”操作可以方便地增加药品库存。
  - **历史追溯**: 可以查看每种药品的详细服药历史记录，并支持删除单条错误记录。
-->
<script setup lang="ts">
/**
 * @description 用药记录页面的主脚本区域。
 * 负责管理所有用药计划和服药日志的状态，处理相关的增删改查逻辑，
 * 以及控制表单和历史记录弹窗的显示。
 */
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { apiRequest } from '../api'
import { useToastStore } from '@/stores/toast'

declare const lucide: { createIcons: () => void; };

// --- 类型定义 (Interfaces) ---
interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: number;
  stock: number | null;
  medication_times: string;
  times?: string[]; // 前端使用
}

interface MedicationLog {
  id: number;
  medication_id: number;
  taken_at: string;
}

// --- 响应式状态 (State) ---
const medications = ref<Medication[]>([]) // 所有用药计划列表
const showMedForm = ref(false) // 是否显示添加药品的表单
const medForm = ref<{ name: string, dosage: string, frequency: number, stock: number | null, times: string[] }>({ name: '', dosage: '', frequency: 1, stock: null, times: ['08:00'] }) // 添加/编辑药品的表单数据
const toastStore = useToastStore() // Toast 通知状态
const showHistoryModal = ref(false) // 是否显示服药历史弹窗
const selectedMedLogs = ref<MedicationLog[]>([]) // 选定药品的服药历史记录
const selectedMedName = ref('') // 选定药品的名称

// --- 生命周期钩子 (Lifecycle Hooks) ---
onMounted(() => {
  loadMedications()
})

/**
 * @description 侦听“每日次数”(`medForm.frequency`)的变化。
 * 当用户调整每日服药次数时，动态地增加或减少“服药时间”(`medForm.times`)的输入框数量，
 * 以确保时间输入框的数量与次数始终保持一致。
 */
watch(
  () => medForm.value.frequency,
  (newFreq: number) => {
    const count = newFreq || 1
    const currentTimes = medForm.value.times
    if (count > currentTimes.length) {
      // 增加时间输入框
      for (let i = currentTimes.length; i < count; i++) {
        currentTimes.push('12:00')
      }
    } else {
      // 减少时间输入框
      medForm.value.times = currentTimes.slice(0, count)
    }
  },
)

// --- 计算属性 (Computed Properties) ---

/**
 * @description 计算出库存不足（少于3次用量）的药品列表。
 */
const lowStockMedications = computed(() => {
  return medications.value.filter(med => isLowOnStock(med));
});

// --- 通用方法 (Common Methods) ---

/**
 * @description 检查单个药品的库存是否不足（少于3次用量）。
 * @param {Medication} med - 要检查的药品对象。
 * @returns {boolean} - 如果库存不足则返回 true，否则返回 false。
 */
const isLowOnStock = (med: Medication): boolean => {
  if (med.stock === null || med.stock === undefined) return false;
  const dosageAmount = parseFloat(med.dosage) || 0;
  if (dosageAmount <= 0) return false;
  const requiredStock = dosageAmount * 3;
  return med.stock < requiredStock;
};


// --- 用药记录方法 (Medication Methods) ---

/**
 * @function loadMedications
 * @description 从API加载当前用户的所有用药计划列表。
 */
const loadMedications = async () => {
  try {
    medications.value = await apiRequest('/medications')
    nextTick(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons()
    })
  } catch (error) {
    if (error instanceof Error) {
      toastStore.showToast({ message: `加载用药记录失败: ${error.message}`, type: 'error' })
    } else {
      toastStore.showToast({ message: '加载用药记录失败: 未知错误', type: 'error' })
    }
  }
}

/**
 * @function addMedication
 * @description 提交表单，添加一个新的用药计划。
 * 成功后会清空表单、关闭表单视图，并刷新用药列表。
 */
const addMedication = async () => {
  try {
    const payload = {
      ...medForm.value,
      medication_times: medForm.value.times.join(','), // 将时间数组转为字符串
    }
    const addedMed = await apiRequest('/medications', 'POST', payload)
    medications.value.unshift(addedMed)
    toastStore.showToast({ message: '添加成功！' })
    showMedForm.value = false
    medForm.value = { name: '', dosage: '', frequency: 1, stock: null, times: ['08:00'] }
  } catch (error) {
    if (error instanceof Error) {
      toastStore.showToast({ message: `添加失败: ${error.message}`, type: 'error' })
    } else {
      toastStore.showToast({ message: '添加失败: 未知错误', type: 'error' })
    }
  }
}

/**
 * @function deleteMedication
 * @description 删除一个指定的用药计划。
 * @param {Medication} med - 要删除的药品对象。
 */
const deleteMedication = async (med: Medication) => {
  if (confirm(`确定要删除 "${med.name}" 吗?`)) {
    try {
      await apiRequest(`/medications/${med.id}`, 'DELETE')
      medications.value = medications.value.filter((m) => m.id !== med.id)
      toastStore.showToast({ message: '删除成功' })
    } catch (error) {
      if (error instanceof Error) {
        toastStore.showToast({ message: `删除失败: ${error.message}`, type: 'error' })
      } else {
        toastStore.showToast({ message: '删除失败: 未知错误', type: 'error' })
      }
    }
  }
}

/**
 * @function refillMedication
 * @description 为指定药品补充库存。
 * 会弹出一个 `prompt` 对话框让用户输入补充数量。
 * @param {Medication} med - 要补充库存的药品对象。
 */
const refillMedication = async (med: Medication) => {
  const amountStr = prompt(`为 "${med.name}" 补充多少库存?`, '10')
  if (amountStr) {
    const amountNum = parseInt(amountStr, 10)
    if (!isNaN(amountNum)) {
      const updatedMed = { ...med, stock: (med.stock || 0) + amountNum }
      try {
        await apiRequest(`/medications/${med.id}`, 'PUT', updatedMed)
        const medInArray = medications.value.find(m => m.id === med.id)
        if(medInArray) medInArray.stock = updatedMed.stock
        toastStore.showToast({ message: '库存补充成功' })
      } catch (error) {
        if (error instanceof Error) {
          toastStore.showToast({ message: `补充失败: ${error.message}`, type: 'error' })
        } else {
          toastStore.showToast({ message: '补充失败: 未知错误', type: 'error' })
        }
      }
    }
  }
}

/**
 * @function takeMedication
 * @description 执行一次“服用”操作。
 * 会根据药品的“每次用量”来扣减库存，并调用API在后端创建一条服药日志。
 * @param {Medication} med - 要服用的药品对象。
 */
const takeMedication = async (med: Medication) => {
  const dosageAmount = parseFloat(med.dosage) || 1
  if (med.stock && med.stock >= dosageAmount) {
    try {
      await apiRequest(`/medications/${med.id}/take`, 'POST', { dosageAmount })
      const medInArray = medications.value.find(m => m.id === med.id)
      if(medInArray && medInArray.stock) medInArray.stock -= dosageAmount
      toastStore.showToast({ message: `已服用: ${med.name}` })
    } catch (error) {
      if (error instanceof Error) {
        toastStore.showToast({ message: `操作失败: ${error.message}`, type: 'error' })
      } else {
        toastStore.showToast({ message: '操作失败: 未知错误', type: 'error' })
      }
    }
  } else {
    toastStore.showToast({ message: '库存不足！', type: 'error' })
  }
}

/**
 * @function viewHistory
 * @description 从API获取并显示指定药品的服药历史记录弹窗。
 * @param {Medication} med - 要查看历史的药品对象。
 */
const viewHistory = async (med: Medication) => {
  try {
    selectedMedName.value = med.name
    selectedMedLogs.value = await apiRequest(`/medications/${med.id}/logs`)
    showHistoryModal.value = true
    nextTick(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons()
    })
  } catch (error) {
    if (error instanceof Error) {
      toastStore.showToast({ message: `加载历史失败: ${error.message}`, type: 'error' })
    } else {
      toastStore.showToast({ message: '加载历史失败: 未知错误', type: 'error' })
    }
  }
}

/**
 * @function deleteMedLog
 * @description 从历史记录弹窗中删除一条指定的服药日志。
 * @param {number} logId - 要删除的日志ID。
 */
const deleteMedLog = async (logId: number) => {
  if (confirm('确定要删除这条服药记录吗？')) {
    try {
      await apiRequest(`/medications/logs/${logId}`, 'DELETE')
      selectedMedLogs.value = selectedMedLogs.value.filter((log) => log.id !== logId)
      toastStore.showToast({ message: '记录删除成功' })
    } catch (error) {
      if (error instanceof Error) {
        toastStore.showToast({ message: `删除失败: ${error.message}`, type: 'error' })
      } else {
        toastStore.showToast({ message: '删除失败: 未知错误', type: 'error' })
      }
    }
  }
}

// --- 生命周期钩子 (Lifecycle Hooks) ---
/**
 * @description 组件挂载后，立即调用 `loadMedications` 来加载初始的用药计划数据。
 */
onMounted(() => {
  loadMedications()
})
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-3xl mobile-px-0">
    <header class="flex justify-between items-center mb-6">
      <div class="bg-white/80 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4 rounded-xl shadow border border-white/20">
        <h1 class="text-xl md:text-2xl font-bold">用药记录</h1>
        <p class="text-xs md:text-gray-500 mt-1">管理您的用药计划</p>
      </div>
      <button
        @click="showMedForm = !showMedForm"
        class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 md:px-4 rounded-lg shadow-md transition-all flex items-center space-x-1 md:space-x-2 text-sm md:text-base"
      >
        <i data-lucide="plus-circle" class="w-5 h-5"></i>
        <span class="hidden sm:inline">添加药品</span>
        <span class="sm:hidden">添加</span>
      </button>
    </header>

    <!-- 库存不足提醒 -->
    <div v-if="lowStockMedications.length > 0" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg shadow-md" role="alert">
      <div class="flex">
        <div class="py-1"><i data-lucide="alert-triangle" class="h-6 w-6 text-red-500 mr-4"></i></div>
        <div>
          <p class="font-bold">库存不足提醒</p>
          <p class="text-sm">
            以下药品库存已不足未来三次用量，请及时补充:
            <span v-for="(med, index) in lowStockMedications" :key="med.id" class="font-semibold">
              {{ med.name }}{{ index < lowStockMedications.length - 1 ? ', ' : '' }}
            </span>
          </p>
        </div>
      </div>
    </div>

    <div v-if="showMedForm" class="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-md mb-6 border border-white/20">
        <h2 class="text-xl font-semibold mb-4">添加新的用药计划</h2>
        <form @submit.prevent="addMedication">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <div class="flex justify-between items-end mb-1">
                <label class="block text-sm font-medium text-gray-700">药品名称</label>
              </div>
              <input
                type="text"
                v-model="medForm.name"
                required
                placeholder="请输入药品名称"
                class="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">每次用量</label
              ><input
                type="text"
                v-model="medForm.dosage"
                class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">每日次数</label
              ><input
                type="number"
                v-model.number="medForm.frequency"
                min="1"
                class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700">当前库存</label>
              <input
                type="number"
                v-model.number="medForm.stock"
                min="0"
                class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- 动态时间选择 -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700">服药时间</label>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                <div v-for="(_, index) in medForm.times" :key="index">
                  <input
                    type="time"
                    v-model="medForm.times[index]"
                    required
                    class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              @click="showMedForm = false"
              class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all"
            >
              确认添加
            </button>
          </div>
        </form>
    </div>

    <main class="space-y-4">
      <div
        v-if="medications.length === 0"
        class="text-center py-12 bg-white/60 backdrop-blur-sm rounded-xl"
      >
        <i data-lucide="pilcrow" class="mx-auto h-12 w-12 text-gray-400"></i>
        <h3 class="mt-2 text-sm font-medium">暂无药品记录</h3>
      </div>
      <div
        v-for="med in medications"
        :key="med.id"
        class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-5 border-l-4 border-blue-500 border-white/20"
      >
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div class="flex-1 mb-4 md:mb-0">
            <h3 class="text-lg font-bold">{{ med.name }}</h3>
            <p class="text-sm">
              用法: {{ med.dosage || '未设置' }} / 每次, {{ med.frequency || 'N/A' }}次 / 每日
            </p>
            <p v-if="med.medication_times" class="text-sm">时间: {{ med.medication_times }}</p>
            <p class="text-sm flex items-center">
              库存: <span class="font-semibold text-lg ml-1">{{ med.stock || 0 }}</span>
              <span v-if="isLowOnStock(med)" class="ml-2 text-red-500 flex items-center text-xs font-bold bg-red-100 px-2 py-0.5 rounded-full">
                <i data-lucide="alert-circle" class="w-4 h-4 mr-1"></i>
                库存不足
              </span>
            </p>
          </div>
          <div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full md:w-auto">
            <button
              @click="takeMedication(med)"
              class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
            >
              服用
            </button>
            <button
              @click="viewHistory(med)"
              class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-all"
            >
              记录
            </button>
            <button
              @click="refillMedication(med)"
              class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
            >
              补充
            </button>
            <button
              @click="deleteMedication(med)"
              class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- 服药历史弹窗 -->
    <div
      v-if="showHistoryModal"
      @click.self="showHistoryModal = false"
      class="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div class="glass-card max-w-md w-full p-8 shadow-2xl relative overflow-hidden animate-slide-up">
        <div class="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <i data-lucide="history" class="w-32 h-32 text-blue-500"></i>
        </div>
        
        <h2 class="text-xl font-bold mb-6 flex items-center space-x-2">
          <i data-lucide="clock" class="w-5 h-5 text-blue-500"></i>
          <span>"{{ selectedMedName }}" 的服药历史</span>
        </h2>
        
        <ul v-if="selectedMedLogs.length > 0" class="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
          <li
            v-for="log in selectedMedLogs"
            :key="log.id"
            class="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl text-sm hover:bg-white/10 transition-colors"
          >
            <span class="font-medium opacity-80">{{ new Date(log.taken_at).toLocaleString('zh-CN') }}</span>
            <button @click="deleteMedLog(log.id)" class="text-red-400 hover:text-red-300 font-bold text-xs uppercase tracking-widest px-3 py-1 bg-red-500/10 rounded-full transition-all active:scale-95">
              删除
            </button>
          </li>
        </ul>
        <div v-if="selectedMedLogs.length === 0" class="text-on-surface-variant/40 text-center py-12 flex flex-col items-center">
          <i data-lucide="inbox" class="w-12 h-12 mb-2 opacity-20"></i>
          <p class="text-sm">暂无服药记录</p>
        </div>
        
        <div class="mt-8">
          <button
            @click="showHistoryModal = false"
            class="w-full py-3 bg-white/10 hover:bg-white/20 text-on-surface font-bold rounded-2xl transition-all active:scale-[0.98]"
          >
            关闭
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
