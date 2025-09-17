<script setup lang="ts">
/**
 * @file src/views/StoolView.vue
 * @description “排便记录”页面，提供日历、列表和图表来记录和查看健康数据。
 *
 * 主要功能：
 * - 经典布局：日历、添加表单、历史记录垂直排列。
 * - 图表分析：页面底部有一个独立的“数据分析”模块，包含日期范围选择和条形图，用于可视化每日排便次数。
 * - 动态数据：图表和历史记录列表会根据所选的日期范围同步更新。
 * - 完整功能：提供记录的添加、编辑和删除功能。
 */
import { ref, onMounted, computed, nextTick } from 'vue'
import { apiRequest } from '../api'
import { useToastStore } from '@/stores/toast'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  type ChartData
} from 'chart.js'

// 注册 Chart.js 组件
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

declare const lucide: { createIcons: () => void; };

// --- 类型定义 (Interfaces) ---
interface StoolLog {
  id: number;
  log_date: string;
  stool_type: number | null;
  notes: string;
}

// --- 响应式状态 (State) ---
const toastStore = useToastStore()
const viewDate = ref(new Date()) // 日历当前显示的月份
const allStoolLogs = ref<StoolLog[]>([]) // 从后端获取的当前日期范围内的所有记录
const showEditModal = ref(false)
const editingLog = ref<StoolLog | null>(null)
const stoolForm = ref({
  log_date: new Date().toISOString().split('T')[0],
  stool_type: null as number | null,
  notes: '',
})

// --- 日期范围和图表状态 ---
const searchStartDate = ref('')
const searchEndDate = ref('')
const chartData = ref<ChartData<'bar'>>({
  labels: [],
  datasets: [
    {
      label: '每日排便次数',
      backgroundColor: '#4A90E2',
      borderColor: '#4A90E2',
      borderRadius: 4,
      data: [],
    },
  ],
})
const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: '每日排便次数统计',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1, // 确保Y轴刻度为整数
      },
    },
  },
})

const stoolTypeDescriptions: Record<number, string> = {
  1: '颗粒状硬球',
  2: '香肠状，表面凹凸',
  3: '香肠状，表面有裂痕',
  4: '香肠或蛇状，光滑柔软',
  5: '断边光滑的柔软团块',
  6: '蓬松的糊状、烂便',
  7: '水样，无固体块',
}

// --- 计算属性 (Computed Properties) ---
const calendar = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, () => null)
  return [...blanks, ...days]
})

const currentMonthDisplay = computed(() => {
  return viewDate.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
})

const loggedDates = computed(() => {
  const dates = new Set<string>()
  // 使用一个独立的API调用来获取所有有记录的日期，避免全量加载
  // 为了简单起见，我们暂时从 allStoolLogs 计算，但未来可以优化
  for (const log of allStoolLogs.value) {
    if (log.log_date && typeof log.log_date === 'string') {
      dates.add(log.log_date.split('T')[0])
    }
  }
  return dates
})

// --- 数据加载与操作方法 (Methods) ---

/**
 * @function formatDate
 * @description 将 Date 对象格式化为 'YYYY-MM-DD' 字符串。
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
}

/**
 * @function fetchData
 * @description 根据日期范围获取图表数据和列表数据。
 */
const fetchData = async () => {
  if (!searchStartDate.value || !searchEndDate.value) {
    toastStore.showToast({ message: '请选择开始和结束日期', type: 'error' });
    return;
  }
  try {
    // 并行获取图表摘要和详细日志
    const [summary, logs] = await Promise.all([
      apiRequest(`/stool-logs/summary?startDate=${searchStartDate.value}&endDate=${searchEndDate.value}`),
      apiRequest(`/stool-logs?startDate=${searchStartDate.value}&endDate=${searchEndDate.value}`)
    ]);

    updateChartData(summary);
    allStoolLogs.value = logs;

    nextTick(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons()
    })
  } catch (error) {
    if (error instanceof Error) {
      toastStore.showToast({ message: `加载数据失败: ${error.message}`, type: 'error' })
    } else {
      toastStore.showToast({ message: '加载数据失败: 未知错误', type: 'error' })
    }
  }
}

/**
 * @function updateChartData
 * @description 使用从后端获取的摘要数据更新图表。
 */
const updateChartData = (summary: Record<string, number>) => {
  const labels: string[] = [];
  const data: number[] = [];
  const start = new Date(searchStartDate.value);
  const end = new Date(searchEndDate.value);

  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    const dateString = formatDate(new Date(d));
    labels.push(dateString.slice(5)); // 只显示 'MM-DD'
    data.push(summary[dateString] || 0);
  }

  chartData.value = {
    ...chartData.value,
    labels,
    datasets: [
      {
        ...chartData.value.datasets[0],
        data,
      },
    ],
  };
};

const addStoolLog = async () => {
  try {
    const newLog = {
      ...stoolForm.value,
      stool_type: stoolForm.value.stool_type ? Number(stoolForm.value.stool_type) : null,
    }
    await apiRequest('/stool-logs', 'POST', newLog)
    toastStore.showToast({ message: '记录已保存！' })
    stoolForm.value = {
      log_date: new Date().toISOString().split('T')[0],
      stool_type: null,
      notes: '',
    }
    await fetchData();
  } catch (error) {
    if (error instanceof Error) {
      toastStore.showToast({ message: `保存失败: ${error.message}`, type: 'error' })
    } else {
      toastStore.showToast({ message: '保存失败: 未知错误', type: 'error' })
    }
  }
}

const openEditModal = (log: StoolLog) => {
  editingLog.value = {
    ...log,
    stool_type: log.stool_type || null,
    log_date: log.log_date.split('T')[0],
  }
  showEditModal.value = true
}

const updateStoolLog = async () => {
  if (!editingLog.value) return
  try {
    await apiRequest(`/stool-logs/${editingLog.value.id}`, 'PUT', editingLog.value)
    toastStore.showToast({ message: '更新成功！' })
    showEditModal.value = false
    editingLog.value = null
    await fetchData();
  } catch (error) {
    if (error instanceof Error) {
      toastStore.showToast({ message: `更新失败: ${error.message}`, type: 'error' })
    } else {
      toastStore.showToast({ message: '更新失败: 未知错误', type: 'error' })
    }
  }
}

const deleteStoolLog = async (log: StoolLog) => {
  if (confirm('确定要删除这条记录吗？')) {
    try {
      await apiRequest(`/stool-logs/${log.id}`, 'DELETE')
      toastStore.showToast({ message: '删除成功' })
      await fetchData();
    } catch (error) {
      if (error instanceof Error) {
        toastStore.showToast({ message: `删除失败: ${error.message}`, type: 'error' })
      } else {
        toastStore.showToast({ message: '删除失败: 未知错误', type: 'error' })
      }
    }
  }
}

// --- 日历相关方法 ---
const changeMonth = (offset: number) => {
  const newDate = new Date(viewDate.value)
  newDate.setMonth(newDate.getMonth() + offset)
  viewDate.value = newDate
}

const getDayClasses = (day: number) => {
  const classes: Record<string, boolean> = {}
  const today = new Date()
  const isCurrentDayToday =
    today.getDate() === day &&
    today.getMonth() === viewDate.value.getMonth() &&
    today.getFullYear() === viewDate.value.getFullYear()

  const checkDate = `${viewDate.value.getFullYear()}-${String(viewDate.value.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const hasLog = loggedDates.value.has(checkDate)

  if (isCurrentDayToday) {
    classes['bg-blue-100'] = true;
    classes['text-blue-600'] = true;
    classes['font-bold'] = true;
  }
  if (hasLog) {
    classes['bg-red-200'] = true;
    classes['text-red-700'] = true;
    classes['font-semibold'] = true;
  }
  return classes
}

// --- 生命周期钩子 (Lifecycle Hooks) ---
onMounted(() => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6);
  searchStartDate.value = formatDate(startDate);
  searchEndDate.value = formatDate(endDate);
  fetchData();
  nextTick(() => {
    if (typeof lucide !== 'undefined') lucide.createIcons()
  })
})
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-3xl">
    <header class="mb-6">
      <div class="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl shadow border border-white/20">
        <h1 class="text-2xl font-bold">排便记录</h1>
        <p class="text-gray-500 mt-1">记录您的每日健康状况</p>
      </div>
    </header>

    <!-- 日历视图 -->
    <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md mb-6 border border-white/20">
      <div class="flex items-center justify-between mb-2">
        <button @click="changeMonth(-1)" class="p-2 rounded-full hover:bg-gray-200">
          <i data-lucide="chevron-left"></i>
        </button>
        <h3 class="font-semibold text-lg">{{ currentMonthDisplay }}</h3>
        <button @click="changeMonth(1)" class="p-2 rounded-full hover:bg-gray-200">
          <i data-lucide="chevron-right"></i>
        </button>
      </div>
      <div class="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
        <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <div v-for="(day, index) in calendar" :key="index" class="h-9 flex items-center justify-center">
          <div v-if="day" class="w-8 h-8 flex items-center justify-center rounded-full relative transition-colors" :class="getDayClasses(day)">
            {{ day }}
          </div>
        </div>
      </div>
    </div>

    <!-- 添加记录表单 -->
    <div class="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-md mb-6 border border-white/20">
      <h2 class="text-xl font-semibold mb-4">添加记录</h2>
      <form @submit.prevent="addStoolLog">
        <div class="space-y-4">
          <div>
            <label for="stool-date-add" class="block text-sm font-medium text-gray-700">日期</label>
            <input type="date" id="stool-date-add" v-model="stoolForm.log_date" required class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label for="stool-type-add" class="block text-sm font-medium text-gray-700">大便类型 (布里斯托分类法)</label>
            <select id="stool-type-add" v-model.number="stoolForm.stool_type" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
              <option :value="null">不记录类型</option>
              <option v-for="(desc, type) in stoolTypeDescriptions" :key="type" :value="type">类型{{ type }}: {{ desc }}</option>
            </select>
          </div>
          <div>
            <label for="stool-notes-add" class="block text-sm font-medium text-gray-700">备注</label>
            <textarea id="stool-notes-add" v-model="stoolForm.notes" rows="3" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" placeholder="例如：颜色、感觉等..."></textarea>
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <button type="submit" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center space-x-2">
            <i data-lucide="save" class="w-5 h-5"></i>
            <span>保存记录</span>
          </button>
        </div>
      </form>
    </div>

    <!-- 历史记录 -->
    <main class="mb-6">
      <h2 class="inline-block text-xl font-semibold mb-4 bg-white/70 backdrop-blur-sm px-3 py-1 rounded-lg">历史记录 ({{ searchStartDate }} ~ {{ searchEndDate }})</h2>
      <div v-if="allStoolLogs.length === 0" class="text-center py-12 bg-white/60 backdrop-blur-sm rounded-xl">
        <p>当前日期范围没有记录</p>
      </div>
      <div class="space-y-3">
        <div v-for="log in allStoolLogs" :key="log.id" class="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm flex justify-between items-start border border-white/20">
          <div>
            <p class="font-semibold">{{ new Date(log.log_date).toLocaleDateString() }}</p>
            <p class="text-sm text-gray-700">
              {{ log.stool_type ? `类型${log.stool_type}: ${stoolTypeDescriptions[log.stool_type]}` : '已记录' }}
            </p>
            <p v-if="log.notes" class="text-xs text-gray-500 mt-1 pl-1 border-l-2">备注: {{ log.notes }}</p>
          </div>
          <div class="flex space-x-2">
            <button @click="openEditModal(log)" class="text-blue-500 hover:text-blue-700 p-1">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button @click="deleteStoolLog(log)" class="text-xs bg-red-100 text-red-600 hover:bg-red-200 rounded-full px-2 py-1 font-semibold transition-colors">删除</button>
          </div>
        </div>
      </div>
    </main>

    <!-- 数据查询与图表 -->
    <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md mt-6 border border-white/20">
      <h2 class="text-xl font-semibold mb-4">数据分析</h2>
      <div class="flex flex-col md:flex-row items-center gap-4 mb-4">
        <div>
          <label for="start-date" class="text-sm font-medium text-gray-700">开始日期</label>
          <input type="date" id="start-date" v-model="searchStartDate" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div>
          <label for="end-date" class="text-sm font-medium text-gray-700">结束日期</label>
          <input type="date" id="end-date" v-model="searchEndDate" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"/>
        </div>
        <button @click="fetchData" class="self-end bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all">
          查询
        </button>
      </div>
      <div class="h-64">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEditModal" @click.self="showEditModal = false" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4">编辑记录</h2>
        <form v-if="editingLog" @submit.prevent="updateStoolLog">
          <div class="space-y-4">
            <div>
              <label for="stool-date-edit" class="block text-sm font-medium text-gray-700">日期</label>
              <input type="date" id="stool-date-edit" v-model="editingLog.log_date" required class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
              <label for="stool-type-edit" class="block text-sm font-medium text-gray-700">大便类型</label>
              <select id="stool-type-edit" v-model.number="editingLog.stool_type" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
                <option :value="null">不记录类型</option>
                <option v-for="(desc, type) in stoolTypeDescriptions" :key="type" :value="type">类型{{ type }}: {{ desc }}</option>
              </select>
            </div>
            <div>
              <label for="stool-notes-edit" class="block text-sm font-medium text-gray-700">备注</label>
              <textarea id="stool-notes-edit" v-model="editingLog.notes" rows="3" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"></textarea>
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-2">
            <button type="button" @click="showEditModal = false" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">取消</button>
            <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">保存更改</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
