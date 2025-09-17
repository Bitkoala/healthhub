<!--
  @file src/views/ExerciseView.vue
  @description “运动记录”页面，一个集成了日历、日志、数据分析和可视化的综合运动追踪工具。

  核心功能:
  - **日历交互**: 使用 v-calendar 库展示用户的运动日历。有运动记录的日期会被高亮，用户可以点击任何一天来查看或添加当天的运动日志。
  - **日志管理**: 用户可以为选定的日期添加详细的运动记录，包括运动名称、时长、组数、次数和备注。同时支持删除已有的记录。
  - **数据分析与可视化**:
    - 提供按运动名称和日期范围搜索历史运动记录的功能。
    - 使用 Chart.js 将搜索结果以堆叠柱状图的形式进行可视化，直观地展示在指定时间段内，每日各项运动的总时长分布情况。
-->
<template>
  <div class="max-w-4xl mx-auto p-4 font-sans">
    <header class="mb-8 text-center">
      <div class="bg-gray-50/75 backdrop-blur-sm p-6 rounded-xl shadow-inner">
        <h1 class="text-4xl font-bold text-gray-800">运动记录</h1>
        <p class="text-gray-600 mt-2">在这里记录和查看您的日常运动。</p>
      </div>
    </header>

    <!-- 日历 -->
    <div class="bg-white p-6 rounded-lg shadow-lg mb-8">
      <h2 class="text-2xl font-semibold mb-4 text-gray-700 text-center">日历视图</h2>
      <div class="flex justify-center">
        <VCalendar
          :attributes="calendarAttributes"
          @dayclick="onDayClick"
          @update:pages="onMonthChange"
          borderless
          title-position="left"
        />
      </div>
      <p class="text-sm text-gray-500 mt-2 text-center">* 点击日期以查看或添加当天的运动记录。</p>
    </div>

    <!-- 运动记录详情和表单 -->
    <div v-if="selectedDate" class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- 当天记录 -->
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h2 class="text-2xl font-semibold mb-4 text-gray-700">
          {{ selectedDate.toLocaleDateString() }} 运动日志
        </h2>
        <div v-if="exerciseLogs.length > 0" class="space-y-4">
          <div
            v-for="log in exerciseLogs"
            :key="log.id"
            class="p-4 border rounded-md bg-gray-50 relative"
          >
            <p class="font-bold text-lg text-blue-600">{{ log.exercise_name }}</p>
            <p v-if="log.duration_minutes" class="text-sm text-gray-600">
              时长: {{ log.duration_minutes }} 分钟
            </p>
            <p v-if="log.sets || log.reps" class="text-sm text-gray-600">
              组数/次数: {{ log.sets || 'N/A' }} / {{ log.reps || 'N/A' }}
            </p>
            <p v-if="log.notes" class="text-sm text-gray-500 mt-2">备注: {{ log.notes }}</p>
            <button
              @click="deleteExerciseLog(log.id)"
              class="absolute top-2 right-2 text-xs bg-red-100 text-red-600 hover:bg-red-200 rounded-full px-2 py-1 font-semibold transition-colors"
            >
              删除
            </button>
          </div>
        </div>
        <p v-else class="text-gray-500">今天还没有运动记录。</p>
      </div>

      <!-- 添加新记录表单 -->
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h2 class="text-2xl font-semibold mb-4 text-gray-700">添加新运动</h2>
        <form @submit.prevent="addExerciseLog" class="space-y-4">
          <input
            v-model="newExercise.exercise_name"
            type="text"
            placeholder="运动名称 (例如: 跑步)"
            required
            class="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <div class="grid grid-cols-3 gap-4">
            <input
              v-model.number="newExercise.duration_minutes"
              type="number"
              placeholder="时长(分钟)"
              class="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              v-model.number="newExercise.sets"
              type="number"
              placeholder="组数"
              class="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <input
              v-model.number="newExercise.reps"
              type="number"
              placeholder="次数"
              class="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <textarea
            v-model="newExercise.notes"
            placeholder="备注 (可选)"
            rows="3"
            class="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
          ></textarea>
          <button
            type="submit"
            class="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            添加记录
          </button>
        </form>
      </div>
    </div>

    <!-- 运动数据分析 -->
    <div class="bg-white p-6 rounded-lg shadow-lg mt-8">
      <h2 class="text-2xl font-semibold mb-4 text-gray-700">运动数据分析</h2>

      <!-- 搜索表单 -->
      <form @submit.prevent="performSearch" class="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <label for="search-exercise" class="block text-sm font-medium text-gray-600">运动名称</label>
          <input
            id="search-exercise"
            v-model="searchParams.exerciseName"
            type="text"
            placeholder="全部运动"
            class="mt-1 p-2 border rounded-md w-48"
          />
        </div>
        <div>
          <label for="search-start-date" class="block text-sm font-medium text-gray-600">开始日期</label>
          <input
            id="search-start-date"
            v-model="searchParams.startDate"
            type="date"
            required
            class="mt-1 p-2 border rounded-md"
          />
        </div>
        <div>
          <label for="search-end-date" class="block text-sm font-medium text-gray-600">结束日期</label>
          <input
            id="search-end-date"
            v-model="searchParams.endDate"
            type="date"
            required
            class="mt-1 p-2 border rounded-md"
          />
        </div>
        <button
          type="submit"
          class="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
        >
          搜索
        </button>
      </form>

      <!-- 结果图表 -->
      <div v-if="searchResult.length" class="relative h-96">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
      <p v-else class="text-gray-500">没有找到符合条件的运动记录，请调整搜索条件后重试。</p>
    </div>

  </div>
</template>

<script setup lang="ts">
/**
 * @description 运动记录页面的主脚本区域。
 * 负责管理所有与运动记录相关的状态、API请求、用户交互逻辑以及图表数据的生成与配置。
 */
import { ref, onMounted, computed, watch } from 'vue';
import { Calendar as VCalendar } from 'v-calendar';
import 'v-calendar/style.css';
import { apiRequest } from '../api';
import { useToastStore } from '@/stores/toast';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  type ChartOptions,
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

// --- 类型定义 (Interfaces) ---
interface ExerciseLog {
  id: number;
  exercise_name: string;
  duration_minutes: number | null;
  sets: number | null;
  reps: number | null;
  notes: string | null;
  log_date: string;
}

import type { TooltipItem } from 'chart.js';

/**
 * @function formatDate
 * @description 将 Date 对象或日期字符串统一格式化为 'YYYY-MM-DD' 格式的字符串。
 * @param {Date | string} date - 需要格式化的日期。
 * @returns {string} 格式化后的日期字符串。
 */
const formatDate = (date: Date | string): string => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- 响应式状态 (State) ---
const toastStore = useToastStore();
const selectedDate = ref(new Date());
const exerciseLogs = ref<ExerciseLog[]>([]);
const newExercise = ref({
  exercise_name: '',
  duration_minutes: null as number | null,
  sets: null as number | null,
  reps: null as number | null,
  notes: '',
});
const highlightedDates = ref<Date[]>([]);
const searchParams = ref({
  exerciseName: '',
  startDate: '',
  endDate: '',
});
const searchResult = ref<ExerciseLog[]>([]);

/**
 * @function fetchExerciseSummary
 * @description 获取指定月份的运动总结，即查询该月中有运动记录的日期列表，用于在日历上进行高亮显示。
 * @param {number} year - 年份。
 * @param {number} month - 月份。
 */
const fetchExerciseSummary = async (year: number, month: number) => {
  try {
    const data = await apiRequest(`/exercise/summary/${year}/${month}`);
    highlightedDates.value = data.map((dateStr: string) => new Date(dateStr + 'T00:00:00'));
  } catch (error) {
    toastStore.showToast({ message: `获取运动总结失败: ${(error as Error).message}`, type: 'error' });
  }
};

/**
 * @function fetchLogsForDate
 * @description 获取并加载指定日期的所有运动日志列表。
 * @param {Date} date - 需要查询的日期。
 */
const fetchLogsForDate = async (date: Date) => {
  try {
    const dateStr = formatDate(date);
    exerciseLogs.value = await apiRequest(`/exercise/${dateStr}`);
  } catch (error) {
    toastStore.showToast({ message: `获取当天运动记录失败: ${(error as Error).message}`, type: 'error' });
    exerciseLogs.value = [];
  }
};

/**
 * @function addExerciseLog
 * @description 提交并添加一条新的运动日志。
 * 成功后会清空表单、重新加载当天的日志列表，并更新日历的总结信息。
 */
const addExerciseLog = async () => {
  if (!newExercise.value.exercise_name) {
    toastStore.showToast({ message: '运动名称不能为空', type: 'error' });
    return;
  }
  try {
    const payload = {
      ...newExercise.value,
      log_date: formatDate(selectedDate.value),
    };
    await apiRequest('/exercise', 'POST', payload);
    toastStore.showToast({ message: '运动记录已添加', type: 'success' });
    newExercise.value = { exercise_name: '', duration_minutes: null, sets: null, reps: null, notes: '' };
    await fetchLogsForDate(selectedDate.value);
    const today = new Date();
    await fetchExerciseSummary(today.getFullYear(), today.getMonth() + 1);
  } catch (error) {
    toastStore.showToast({ message: `添加运动记录失败: ${(error as Error).message}`, type: 'error' });
  }
};

/**
 * @function deleteExerciseLog
 * @description 删除一条指定的运动日志。
 * 成功后会重新加载当天的日志、日历总结，并刷新当前的搜索结果图表。
 * @param {number} logId - 要删除的日志ID。
 */
const deleteExerciseLog = async (logId: number) => {
  if (!confirm('确定要删除这条记录吗？')) return;
  try {
    await apiRequest(`/exercise/${logId}`, 'DELETE');
    toastStore.showToast({ message: '记录已删除', type: 'success' });
    await fetchLogsForDate(selectedDate.value);
    const today = new Date();
    await fetchExerciseSummary(today.getFullYear(), today.getMonth() + 1);
    await performSearch();
  } catch (error) {
    toastStore.showToast({ message: `删除运动记录失败: ${(error as Error).message}`, type: 'error' });
  }
};

/**
 * @function performSearch
 * @description 根据用户设定的搜索参数（运动名称、起止日期）从后端获取运动记录，并更新用于图表展示的 `searchResult` 状态。
 */
const performSearch = async () => {
  try {
    const params = new URLSearchParams({
      startDate: searchParams.value.startDate,
      endDate: searchParams.value.endDate,
    });
    if (searchParams.value.exerciseName) {
      params.append('exerciseName', searchParams.value.exerciseName);
    }
    const data = await apiRequest(`/exercise/search?${params.toString()}`);
    searchResult.value = data;
  } catch (error) {
    toastStore.showToast({ message: `搜索失败: ${(error as Error).message}`, type: 'error' });
    searchResult.value = [];
  }
};

// --- 计算属性 (Computed Properties) ---

/**
 * @computed calendarAttributes
 * @description 为 v-calendar 组件动态生成配置属性。
 * - `has-exercise`: 使用红点标记所有有运动记录的日期。
 * - `selected`: 使用蓝色实心背景高亮当前用户选中的日期。
 */
const calendarAttributes = computed(() => [
  {
    key: 'has-exercise',
    dot: 'red',
    dates: highlightedDates.value,
  },
  {
    key: 'selected',
    highlight: {
      color: 'blue',
      fillMode: 'solid' as const,
    },
    dates: selectedDate.value ? [selectedDate.value] : [],
  },
]);

/**
 * @computed chartData
 * @description 根据 `searchResult` 状态，动态计算并生成 Chart.js Bar 图表所需的数据格式。
 * 该过程包括：
 * 1. 按日期和运动名称对运动时长进行分组和汇总。
 * 2. 提取所有唯一的日期（作为X轴标签）和运动名称。
 * 3. 为每种运动创建一个数据集（dataset），包含其在每天的总时长。
 * @returns {object} Chart.js 的 `data` 对象。
 */
const chartData = computed(() => {
  const results = searchResult.value;
  if (!results || !results.length) {
    return { labels: [], datasets: [] };
  }

  // 1. 按日期和运动名称汇总时长
  const dailyTotals = results.reduce((acc: Record<string, Record<string, number>>, log: ExerciseLog) => {
    const date = formatDate(log.log_date);
    const exercise = log.exercise_name;
    const duration = log.duration_minutes || 0;

    if (!acc[date]) {
      acc[date] = {};
    }
    if (!acc[date][exercise]) {
      acc[date][exercise] = 0;
    }
    acc[date][exercise] += duration;

    return acc;
  }, {} as Record<string, Record<string, number>>);

  // 2. 获取所有日期和运动名称
  const labels = Object.keys(dailyTotals).sort();
  const exerciseNames = [...new Set(results.map((log: ExerciseLog) => log.exercise_name))];

  // 3. 定义图表颜色
  const colors = [
    '#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f59e0b', '#ec4899', '#6366f1', '#d946ef'
  ];
  const colorMap = exerciseNames.reduce((map: Record<string, string>, name: string, index: number) => {
    map[name] = colors[index % colors.length];
    return map;
  }, {});

  // 4. 为每种运动创建一个数据集
  const datasets = exerciseNames.map(name => ({
    label: name,
    backgroundColor: colorMap[name],
    data: labels.map(date => dailyTotals[date][name] || 0),
  }));

  return { labels, datasets };
});

/**
 * @description Chart.js 图表的配置选项。
 * - `responsive`: 图表将自适应容器大小。
 * - `maintainAspectRatio`: false，允许图表在高度上自由缩放。
 * - `scales`: 配置X轴和Y轴，两者都设置为堆叠模式 (`stacked: true`)。
 * - `plugins.tooltip.callbacks`: 自定义图表项的提示信息格式，使其更具可读性。
 */
const chartOptions = ref<ChartOptions<'bar'>>({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      title: {
        display: true,
        text: '总时长 (分钟)',
      },
    },
  },
  plugins: {
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      callbacks: {
        title: (context: TooltipItem<'bar'>[]) => `日期: ${context[0].label}`,
        label: (context: TooltipItem<'bar'>) => {
          const label = context.dataset.label || '';
          const value = context.parsed.y;
          if (value > 0) {
            return `${label}: ${value} 分钟`;
          }
          return ''; // Return empty string instead of null
        },
      },
    },
  },
});

// --- 事件处理器 (Event Handlers) ---

/**
 * @function onDayClick
 * @description v-calendar 日期点击事件的回调函数。
 * @param {object} day - v-calendar 传递的日期对象。
 */
const onDayClick = (day: { date: Date }) => {
  selectedDate.value = day.date;
};

/**
 * @function onMonthChange
 * @description v-calendar 月份切换事件的回调函数。
 * 当用户切换日历的月份时，重新获取新月份的运动总结数据。
 * @param {Array<object>} pages - v-calendar 传递的页面信息数组。
 */
const onMonthChange = async (pages: { year: number; month: number }[]) => {
  if (pages && pages.length > 0) {
    const { year, month } = pages[0];
    await fetchExerciseSummary(year, month);
  }
};

// --- 生命周期钩子 (Lifecycle Hooks) ---

/**
 * @description 组件挂载后执行的初始化操作。
 * 1. 获取当月的运动总结。
 * 2. 获取当天的运动日志。
 * 3. 设置默认搜索范围为最近7天，并执行一次初始搜索以填充图表。
 */
onMounted(async () => {
  const today = new Date();
  await fetchExerciseSummary(today.getFullYear(), today.getMonth() + 1);
  await fetchLogsForDate(today);

  // 设置默认搜索范围为最近7天，并执行一次初始搜索
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);
  searchParams.value.startDate = formatDate(sevenDaysAgo);
  searchParams.value.endDate = formatDate(today);
  await performSearch();
});

/**
 * @description 侦听 `selectedDate` 状态的变化。
 * 当用户通过点击日历选择了新的日期时，自动调用 `fetchLogsForDate` 来加载新选定日期的运动日志。
 */
watch(selectedDate, (newDate) => {
  if (newDate) {
    fetchLogsForDate(newDate);
  }
});
</script>
