<template>
  <div class="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
    <div class="inline-block bg-white/80 backdrop-blur-sm px-6 py-3 rounded-xl shadow mb-6">
      <h1 class="text-2xl font-bold text-gray-800">体重管理</h1>
    </div>

    <!-- Key Metrics Display -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow-md text-center">
        <h3 class="text-sm font-medium text-gray-500">当前体重</h3>
        <p class="text-2xl font-bold">{{ currentWeight || 'N/A' }} <span v-if="currentWeight" class="text-lg">kg</span></p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow-md text-center">
        <h3 class="text-sm font-medium text-gray-500">BMI 指数</h3>
        <p class="text-2xl font-bold">{{ bmi.value || 'N/A' }}</p>
        <p :class="bmi.color" class="text-sm font-semibold">{{ bmi.label }}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow-md text-center">
        <h3 class="text-sm font-medium text-gray-500">体重变化</h3>
        <p class="text-2xl font-bold" :class="weightChange.color">{{ weightChange.value }} <span v-if="weightChange.value !== 'N/A'" class="text-lg">kg</span></p>
      </div>
    </div>

    <!-- BMI Reference Guide -->
    <div v-if="height && bmiReferenceRanges" class="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 class="text-lg font-semibold mb-4">BMI 体重范围参考 (基于您 {{ height }}cm 的身高)</h3>
        <ul class="space-y-2">
            <li v-for="item in bmiReferenceRanges" :key="item.label" class="flex justify-between items-center p-2 rounded-md" :class="bmi.label === item.label ? 'bg-blue-50' : ''">
                <span class="font-semibold" :class="item.color">{{ item.label }}</span>
                <span class="text-gray-700">{{ item.range }}</span>
            </li>
        </ul>
        <p class="text-xs text-gray-500 mt-4">*BMI分类标准参考中国标准。</p>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md">
      <!-- Record Form -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">记录新数据</h3>
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex-grow">
            <label for="weight-input" class="block text-sm font-medium text-gray-700">今日体重 (kg)</label>
            <input type="number" id="weight-input" v-model.number="newWeight" placeholder="例如: 65.5" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
          </div>
          <button @click="saveWeight" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">保存体重</button>

          <div class="flex-grow">
            <label class="block text-sm font-medium text-gray-700">身高 (cm)</label>
            <div v-if="!height || isEditingHeight" class="flex items-center gap-2 mt-1">
                <input type="number" v-model.number="height" placeholder="例如: 175" class="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                <button @click="saveHeight" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap">保存</button>
                <button v-if="isEditingHeight" @click="isEditingHeight = false" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 whitespace-nowrap">取消</button>
            </div>
            <div v-else class="flex items-center gap-2 h-[42px]">
                <p class="text-lg">{{ height }} cm</p>
                <button @click="isEditingHeight = true" class="text-sm text-blue-600 hover:underline">修改</button>
            </div>
          </div>
        </div>
      </div>

      <!-- History Table -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">最近 15 条记录</h3>
        <div class="max-h-60 overflow-y-auto border rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期时间</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">体重 (kg)</th>
                <th scope="col" class="relative px-6 py-3">
                  <span class="sr-only">删除</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="weights.length === 0">
                <td colspan="3" class="px-6 py-4 text-center text-gray-500">暂无记录</td>
              </tr>
              <tr v-for="log in sortedWeights" :key="log.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ formatDateTime(log.log_datetime) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ log.weight }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button @click="deleteWeight(log.id)" class="text-red-600 hover:text-red-900">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Historical Data Query -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">历史记录查询</h3>
        <div class="flex flex-wrap items-end gap-4">
          <div>
            <label for="start-date" class="block text-sm font-medium text-gray-700">开始时间</label>
            <input type="datetime-local" id="start-date" v-model="historyStartDate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
          </div>
          <div>
            <label for="end-date" class="block text-sm font-medium text-gray-700">结束时间</label>
            <input type="datetime-local" id="end-date" v-model="historyEndDate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
          </div>
          <button @click="fetchHistory" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">查询</button>
        </div>
      </div>

      <!-- Weight Chart -->
      <div v-if="displayChartData.labels && displayChartData.labels.length > 1">
        <h3 class="text-lg font-semibold mb-4">{{ chartTitle }}</h3>
        <Line :data="displayChartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file src/views/WeightView.vue
 * @description 体重管理功能页面。
 *
 * 该组件提供以下功能：
 * - 显示当前体重、BMI指数和总体重变化等关键指标。
 * - 允许用户记录新的体重数据和更新身高。
 * - 以表格形式展示最近的体重记录，并提供删除功能。
 * - 提供按时间范围查询历史体重数据的功能。
 * - 使用 Chart.js 将体重数据可视化为折线图。
 */
import { ref, computed, onMounted } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, type ChartOptions } from 'chart.js';
import { apiRequest } from '../api';
import { useToastStore } from '@/stores/toast';

// 注册 Chart.js 所需的组件，否则图表无法显示。
ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

/**
 * @interface WeightLog
 * @description 定义体重记录对象的数据结构。
 */
interface WeightLog {
  id: number;
  user_id: number;
  log_datetime: string;
  weight: number;
}

interface WeightDataResponse {
  weights: WeightLog[];
  height: number | null;
}

// --- 响应式状态定义 ---

const toastStore = useToastStore();
/** @state {ref<WeightLog[]>} weights - 存储从后端获取的最近体重记录列表。 */
const weights = ref<WeightLog[]>([]);
/** @state {ref<number | null>} height - 用户的身高(cm)，用于计算BMI。 */
const height = ref<number | null>(null);
/** @state {ref<boolean>} isEditingHeight - 是否处于身高编辑模式。 */
const isEditingHeight = ref<boolean>(false);
/** @state {ref<number | null>} newWeight - 绑定到输入框的新体重值。 */
const newWeight = ref<number | null>(null);
/** @state {ref<string>} historyStartDate - 历史查询的开始日期时间。 */
const historyStartDate = ref('');
/** @state {ref<string>} historyEndDate - 历史查询的结束日期时间。 */
const historyEndDate = ref('');
/** @state {ref<WeightLog[]>} historyWeights - 存储历史查询结果的列表。 */
const historyWeights = ref<WeightLog[]>([]);


// --- API 调用与数据处理方法 ---

/**
 * @function fetchData
 * @description 从后端获取初始数据，包括最近的体重记录和用户身高。
 */
const fetchData = async () => {
  try {
    const data = await apiRequest('/weight', 'GET') as WeightDataResponse;
    weights.value = data.weights || [];
    height.value = data.height || null;
  } catch (error) {
    toastStore.showToast({ message: `加载数据失败: ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
  }
};

/**
 * @function saveWeight
 * @description 保存一条新的体重记录。
 * 它会获取当前本地时间作为记录时间，并发送到后端。
 */
const saveWeight = async () => {
  if (!newWeight.value || newWeight.value <= 0) {
    toastStore.showToast({ message: '请输入有效的体重值', type: 'error' });
    return;
  }
  // 获取本地时区的时间，并格式化为 YYYY-MM-DD HH:MM:SS
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const localDateTimeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  try {
    await apiRequest('/weight', 'POST', { weight: newWeight.value, log_datetime: localDateTimeString });
    toastStore.showToast({ message: '体重已保存', type: 'success' });
    newWeight.value = null;
    await fetchData();
  } catch (error) {
    toastStore.showToast({ message: `保存失败: ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
  }
};

/**
 * @function saveHeight
 * @description 保存用户的身高信息。
 */
const saveHeight = async () => {
  if (!height.value || height.value <= 0) {
    toastStore.showToast({ message: '请输入有效的身高值', type: 'error' });
    return;
  }
  try {
    await apiRequest('/weight/height', 'PUT', { height: height.value });
    toastStore.showToast({ message: '身高已保存', type: 'success' });
    isEditingHeight.value = false;
    await fetchData();
  } catch (error) {
    toastStore.showToast({ message: `保存失败: ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
  }
};

/**
 * @function deleteWeight
 * @description 根据ID删除一条体重记录。
 * @param {number} id - 要删除的记录的ID。
 */
const deleteWeight = async (id: number) => {
    const logToDelete = sortedWeights.value.find(log => log.id === id);
    if (!logToDelete) return;
    if (!confirm(`确定要删除 ${formatDateTime(logToDelete.log_datetime)} 的体重记录吗？`)) return;
    try {
        await apiRequest(`/weight/${id}`, 'DELETE');
        toastStore.showToast({ message: '记录已删除', type: 'success' });
        await fetchData();
        // 如果删除的是历史记录中的一项，也从历史记录中移除
        const historyIndex = historyWeights.value.findIndex(item => item.id === id);
        if (historyIndex > -1) {
            historyWeights.value.splice(historyIndex, 1);
        }
    } catch (error) {
        toastStore.showToast({ message: `删除失败: ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
    }
};

/**
 * @function fetchHistory
 * @description 根据用户选择的时间范围，从后端查询历史体重数据。
 */
const fetchHistory = async () => {
    if (!historyStartDate.value || !historyEndDate.value) {
        toastStore.showToast({ message: '请选择开始和结束时间', type: 'error' });
        return;
    }
    try {
        // The input value is 'YYYY-MM-DDTHH:mm', format it for the query
        const start = historyStartDate.value.replace('T', ' ') + ':00';
        const end = historyEndDate.value.replace('T', ' ') + ':59';

        const data = await apiRequest(`/weight/history?start_datetime=${start}&end_datetime=${end}`, 'GET') as WeightLog[];
        historyWeights.value = data;
        if (data.length === 0) {
            toastStore.showToast({ message: '该时间段内没有记录', type: 'success' });
        }
    } catch (error) {
        toastStore.showToast({ message: `查询历史记录失败: ${error instanceof Error ? error.message : String(error)}`, type: 'error' });
    }
};


// --- 计算属性 (Computed Properties) ---

/**
 * @computed sortedWeights
 * @description 将 `weights` 数组倒序排列，以便在表格中优先显示最新的记录。
 */
const sortedWeights = computed(() => {
  return [...weights.value].reverse();
});

/**
 * @computed currentWeight
 * @description 从排序后的记录中获取最新的体重值。
 */
const currentWeight = computed(() => {
  return sortedWeights.value.length > 0 ? sortedWeights.value[0].weight : null;
});

/**
 * @computed bmi
 * @description 根据当前体重和身高计算身体质量指数 (BMI)，并返回对应的健康标签和颜色。
 */
const bmi = computed(() => {
  if (!currentWeight.value || !height.value) {
    return { value: null, label: '信息不全', color: 'text-gray-500' };
  }
  const bmiValue = currentWeight.value / ((height.value / 100) ** 2);
  const roundedBmi = parseFloat(bmiValue.toFixed(1));
  let label = '';
  let color = '';
  if (roundedBmi < 18.5) {
    label = '体重过轻';
    color = 'text-blue-500';
  } else if (roundedBmi >= 18.5 && roundedBmi < 24) {
    label = '健康体重';
    color = 'text-green-500';
  } else if (roundedBmi >= 24 && roundedBmi < 28) {
    label = '超重';
    color = 'text-yellow-500';
  } else {
    label = '肥胖';
    color = 'text-red-500';
  }
  return { value: roundedBmi, label, color };
});

/**
 * @function formatDateTime
 * @description 格式化从后端获取的 UTC 日期时间字符串，使其更易读。
 * @param {string} isoString - 例如 '2025-09-16T14:35:00.000Z'
 * @returns {string} - 格式化后的字符串，例如 '2025-09-16 14:35'
 */
const formatDateTime = (isoString: string) => {
  if (!isoString) return 'N/A';
  return isoString.substring(0, 16).replace('T', ' ');
};

/**
 * @computed weightChange
 * @description 计算从第一条记录到最后一条记录的总体重变化。
 * 返回一个包含变化值和对应颜色的对象 (增加为红色，减少为绿色)。
 */
const weightChange = computed(() => {
    if (weights.value.length < 2) {
        return { value: 'N/A', color: 'text-gray-900' };
    }
    // Create a chronological copy to calculate change correctly
    const chronologicalWeights = [...weights.value].sort((a, b) => new Date(a.log_datetime).getTime() - new Date(b.log_datetime).getTime());
    const firstWeight = chronologicalWeights[0].weight;
    const latestWeight = chronologicalWeights[chronologicalWeights.length - 1].weight;
    const change = parseFloat((latestWeight - firstWeight).toFixed(1));

    let color = 'text-gray-500';
    if (change > 0) color = 'text-red-500';
    if (change < 0) color = 'text-green-500';

    return {
        value: change > 0 ? `+${change}` : `${change}`,
        color: color
    };
});


// --- 图表相关计算属性和配置 ---

/**
 * @computed chartTitle
 * @description 根据当前是否在显示历史数据，动态生成图表的标题。
 */
const chartTitle = computed(() => {
  return historyWeights.value.length > 0 ? '历史体重走势' : '最近体重趋势';
});

/**
 * @computed displayChartData
 * @description 准备供 Chart.js 使用的数据格式。
 * 如果有历史查询结果，则使用历史数据；否则，使用最近的体重数据。
 */
const displayChartData = computed(() => {
  const sourceData = historyWeights.value.length > 0 ? historyWeights.value : weights.value;
  // Ensure data is chronological for the chart
  const chronologicalData = [...sourceData].sort((a, b) => new Date(a.log_datetime).getTime() - new Date(b.log_datetime).getTime());

  return {
    labels: chronologicalData.map(log => formatDateTime(log.log_datetime)),
    datasets: [
      {
        label: '体重 (kg)',
        backgroundColor: historyWeights.value.length > 0 ? '#8b5cf6' : '#3b82f6', // Different color for history
        borderColor: historyWeights.value.length > 0 ? '#8b5cf6' : '#3b82f6',
        data: chronologicalData.map(log => log.weight),
        tension: 0.1,
      },
    ],
  };
});

/**
 * @const chartOptions
 * @description Chart.js 的全局配置对象，用于控制图表的响应式行为等。
 */
const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: true,
};

/**
 * @computed bmiReferenceRanges
 * @description 根据用户身高，计算符合中国标准的BMI体重范围。
 */
const bmiReferenceRanges = computed(() => {
    if (!height.value) {
        return null;
    }
    const heightInMeters = height.value / 100;
    const calcWeight = (bmi: number) => (bmi * heightInMeters * heightInMeters).toFixed(1);

    return [
        { label: '体重过轻', range: `< ${calcWeight(18.5)} kg`, color: 'text-blue-500' },
        { label: '健康体重', range: `${calcWeight(18.5)} - ${calcWeight(23.9)} kg`, color: 'text-green-500' },
        { label: '超重', range: `${calcWeight(24.0)} - ${calcWeight(27.9)} kg`, color: 'text-yellow-500' },
        { label: '肥胖', range: `≥ ${calcWeight(28.0)} kg`, color: 'text-red-500' },
    ];
});


// --- Vue 生命周期钩子 ---

/**
 * @hook onMounted
 * @description 组件挂载后，立即调用 `fetchData` 来加载初始数据。
 */
onMounted(fetchData);
</script>
