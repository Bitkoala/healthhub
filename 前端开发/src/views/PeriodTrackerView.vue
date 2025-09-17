<!--
  @file src/views/PeriodTrackerView.vue
  @description 一个统一的视图，用于跟踪月经周期和怀孕进程。
-->
<template>
  <div class="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
    <!-- 统一标题 -->
    <div class="flex justify-between items-center mb-6">
      <div class="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-xl shadow">
        <h1 class="text-2xl font-bold text-gray-800">健康跟踪器</h1>
      </div>

      <!-- 全新设计的模式切换开关 -->
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium text-gray-800 bg-white/70 backdrop-blur-sm px-2 py-1 rounded-lg">普通模式</span>
        <button
          @click="toggleMode"
          role="switch"
          :aria-checked="isPregnancyMode"
          class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          :class="isPregnancyMode ? 'bg-pink-400' : 'bg-blue-400'"
        >
          <span
            aria-hidden="true"
            class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center"
            :class="isPregnancyMode ? 'translate-x-5' : 'translate-x-0'"
          >
            <!-- 根据模式显示不同图标 -->
            <svg v-if="!isPregnancyMode" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7.707 8.707a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L10 11.586l-2.293-2.293z" clip-rule="evenodd" />
            </svg>
            <svg v-if="isPregnancyMode" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-pink-600" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
            </svg>
          </span>
        </button>
        <span class="text-sm font-medium text-gray-800 bg-white/70 backdrop-blur-sm px-2 py-1 rounded-lg">孕期模式</span>
      </div>
    </div>

    <!-- 操作按钮区域 -->
    <div class="flex justify-end items-center mb-6">
      <!-- 经期操作按钮，仅在正常模式下显示 -->
      <div v-if="!isPregnancyMode" class="flex space-x-2">
        <button @click="handleStartPeriod"
                :disabled="!!activePeriod"
                class="px-4 py-2 text-white font-bold rounded-lg shadow-md transition-all"
                :class="[!!activePeriod ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-700']">
          经期开始
        </button>
        <button @click="handleEndPeriod"
                :disabled="!activePeriod"
                class="px-4 py-2 text-white font-bold rounded-lg shadow-md transition-all"
                :class="[!activePeriod ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600']">
          经期结束
        </button>
      </div>
    </div>

    <!-- 孕期模式 UI, 仅在孕期模式下显示 -->
    <div v-if="isPregnancyMode" class="bg-white p-6 rounded-lg shadow-md text-center mb-6">
      <div v-if="lastMenstrualPeriod">
        <h2 class="text-xl font-semibold text-gray-700">当前孕周</h2>
        <p class="text-5xl font-bold text-pink-500 my-4">{{ gestationalWeek }} 周 + {{ gestationalDay }} 天</p>
        <p class="text-gray-500">预产期大约在: {{ estimatedDueDate }}</p>
        <p class="text-sm text-gray-400 mt-4">(基于末次月经第一天: {{ lastMenstrualPeriod.start_date }})</p>
      </div>
      <div v-else>
        <h2 class="text-xl font-semibold text-gray-700">信息不足</h2>
        <p class="mt-4 text-gray-600">无法计算孕周，因为没有找到您的末次月经记录。</p>
        <p class="mt-2 text-gray-500">请先切换回正常模式，并至少记录一次完整的经期。</p>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="bg-white p-6 rounded-lg shadow-md">
      <!-- 日历视图 -->
      <div class="mb-6">
        <div class="flex justify-between items-center mb-4">
          <button @click="prevMonth" class="px-4 py-2 bg-gray-200 rounded-lg">&lt; 上一月</button>
          <h2 class="text-xl font-semibold">{{ currentYear }} 年 {{ currentMonth + 1 }} 月</h2>
          <button @click="nextMonth" class="px-4 py-2 bg-gray-200 rounded-lg">下一月 &gt;</button>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center">
          <div v-for="day in weekDays" :key="day" class="font-semibold text-sm">{{ day }}</div>
          <div
            v-for="day in calendarDays"
            :key="day.date.toISOString()"
            class="p-2 h-24 border rounded-md flex flex-col justify-start items-center cursor-pointer"
            :class="getDayClasses(day)"
            @click="selectDate(day.date)"
          >
            <span class="font-medium">{{ day.date.getDate() }}</span>
            <div class="flex-grow flex flex-col justify-center items-center space-y-1 w-full">
              <div v-if="day.isPeriod" class="text-xs text-white bg-red-500/90 rounded-full px-2 py-0.5 inline-block">经期</div>
              <!-- 预测信息仅在正常模式下显示 -->
              <div v-if="!isPregnancyMode">
                <div v-if="day.isPredictedPeriod && !day.isPeriod" class="text-xs text-red-500">预测经期</div>
                <div v-if="day.isOvulation" class="text-xs text-white bg-purple-500/90 rounded-full px-2 py-0.5 inline-block">排卵期</div>
                <div v-if="day.isFertile && !day.isOvulation" class="text-xs text-white bg-pink-400/90 rounded-full px-2 py-0.5 inline-block">易孕期</div>
              </div>
              <div v-if="day.isSexDay" class="text-red-500">❤️</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 记录表单, 仅在选中日期后显示 -->
      <div v-if="selectedDate" class="mt-8">
        <h3 class="text-lg font-semibold mb-4">记录 {{ selectedDate.toLocaleDateString() }}</h3>
        <!-- 编辑经期记录, 仅在正常模式下显示 -->
        <div v-if="editingRecord && !isPregnancyMode">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">开始日期</label>
              <input type="date" v-model="form.start_date" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" disabled>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">结束日期 (如果不确定，请留空)</label>
              <input type="date" v-model="form.end_date" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">疼痛程度</label>
              <select v-model="form.pain_level" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option>无</option>
                <option>轻度</option>
                <option>中度</option>
                <option>重度</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">流量</label>
              <select v-model="form.flow_volume" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option>偏少</option>
                <option>正常</option>
                <option>偏多</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">颜色</label>
              <select v-model="form.color" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option :value="null">未记录</option>
                <option>褐色</option>
                <option>粉红色</option>
                <option>鲜红色</option>
                <option>暗红色</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">状态</label>
              <select v-model="form.state" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option :value="null">未记录</option>
                <option>点滴状</option>
                <option>正常</option>
                <option>粘稠</option>
                <option>含血块</option>
              </select>
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">备注</label>
            <textarea v-model="form.notes" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
          </div>
          <div class="flex space-x-4">
            <button @click="updateRecord" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">更新记录</button>
            <button @click="deleteRecord" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">删除周期</button>
            <button @click="cancelEdit" class="px-4 py-2 bg-gray-300 rounded-lg">取消</button>
          </div>
        </div>
        <div v-else>
          <div class="border-t pt-4 mt-6">
            <h4 class="text-md font-semibold mb-3">私密记录</h4>
            <div v-if="sexLogOnSelectedDate" class="space-y-4">
              <p class="text-green-600 font-semibold">✓ 已记录爱爱</p>
              <div>
                <label class="block text-sm font-medium text-gray-700">保护措施</label>
                <select v-model="sexLogForm.protection_method" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                  <option :value="null">未记录</option>
                  <option>无保护</option>
                  <option>避孕套</option>
                  <option>避孕药</option>
                  <option>其他</option>
                </select>
              </div>
              <div class="flex space-x-2">
                <button @click="saveSexLog" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">保存</button>
                <button @click="deleteSexLog" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">删除记录</button>
              </div>
            </div>
            <div v-else>
               <button @click="createSexLog" class="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600">记录爱爱 ❤️</button>
            </div>
          </div>
          <hr v-if="!isPregnancyMode" class="my-6">
          <p v-if="!editingRecord && !isPregnancyMode" class="text-gray-500">这一天没有经期记录。您可以点击经期日来编辑详情，或使用主按钮来开始/结束周期。</p>
        </div>
      </div>

      <!-- 健康图表, 仅在正常模式下显示 -->
      <div v-if="!isPregnancyMode" class="mt-8">
        <h3 class="text-lg font-semibold mb-4">健康分析图表</h3>

        <!-- 日期范围筛选 -->
        <div class="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg border">
          <div class="flex-1 min-w-[150px]">
            <label for="chart-start-date" class="block text-sm font-medium text-gray-700">开始日期</label>
            <input type="date" id="chart-start-date" v-model="chartFilter.startDate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
          </div>
          <div class="flex-1 min-w-[150px]">
            <label for="chart-end-date" class="block text-sm font-medium text-gray-700">结束日期</label>
            <input type="date" id="chart-end-date" v-model="chartFilter.endDate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
          </div>
        </div>

        <div v-if="chartData.labels && chartData.labels.length > 0" class="relative h-96">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
        <div v-else class="text-center text-gray-500 p-8 border rounded-lg h-96 flex items-center justify-center">
          <p>在选定时间范围内没有足够的数据来生成图表。请至少记录一个完整的周期，或扩大筛选范围。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem
} from 'chart.js';
import { apiRequest } from '../api';
import { useToastStore } from '@/stores/toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- 工具函数 ---
const parseLocalDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split('T')[0].split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- 接口定义 ---
interface MenstrualRecord {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string | null;
  pain_level: '无' | '轻度' | '中度' | '重度';
  flow_volume: '偏少' | '正常' | '偏多';
  notes: string | null;
  color: string | null;
  state: string | null;
}

interface SexLog {
  id: number;
  log_date: string;
  protection_method: '无保护' | '避孕套' | '避孕药' | '其他' | null;
}

interface Prediction {
  averageCycleLength: number;
  averagePeriodLength: number;
  nextPeriodStartDate: string;
  fertileWindow: { start: string; end: string };
  ovulationDate: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPeriod: boolean;
  isPredictedPeriod: boolean;
  isFertile: boolean;
  isOvulation: boolean;
  isSexDay: boolean;
}

// --- 响应式状态 ---
const toastStore = useToastStore();
const today = new Date();
today.setHours(0, 0, 0, 0);

const currentDate = ref(new Date(today));
const selectedDate = ref<Date | null>(null);
const records = ref<MenstrualRecord[]>([]);
const sexLogs = ref<SexLog[]>([]);
const prediction = ref<Prediction | null>(null);
const editingRecord = ref<MenstrualRecord | null>(null);

const form = ref({
  start_date: '',
  end_date: '',
  pain_level: '无' as MenstrualRecord['pain_level'],
  flow_volume: '正常' as MenstrualRecord['flow_volume'],
  notes: '',
  color: null as string | null,
  state: null as string | null,
});

const sexLogForm = ref<{ protection_method: SexLog['protection_method'] }>({
  protection_method: null,
});

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

const chartFilter = reactive({
  startDate: '',
  endDate: '',
});

// --- 计算属性 ---
const isPregnancyMode = ref(false); // 内部状态，不再依赖全局 store
const activePeriod = computed(() => records.value.find(r => !r.end_date));

const sexLogOnSelectedDate = computed(() => {
  if (!selectedDate.value) return undefined;
  const dateStr = formatLocalDate(selectedDate.value);
  return sexLogs.value.find(log => log.log_date === dateStr);
});

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

// --- 孕期模式计算属性 ---
const lastMenstrualPeriod = computed(() => {
  if (!records.value || records.value.length === 0) return null;
  const sortedRecords = [...records.value]
    .filter(r => r.end_date) // 仅考虑已完成的周期
    .sort((a, b) => {
        const dateA = parseLocalDate(a.start_date);
        const dateB = parseLocalDate(b.start_date);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
    });
  return sortedRecords[0] || null;
});

const gestationalInfo = computed(() => {
  if (!isPregnancyMode.value || !lastMenstrualPeriod.value) return { week: null, day: null, dueDate: null };
  const lmp = parseLocalDate(lastMenstrualPeriod.value.start_date);
  if (!lmp) return { week: null, day: null, dueDate: null };
  const diffTime = Math.max(0, today.getTime() - lmp.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const dueDate = new Date(lmp);
  dueDate.setDate(lmp.getDate() + 280);

  return {
    week: Math.floor(diffDays / 7),
    day: diffDays % 7,
    dueDate: formatLocalDate(dueDate),
  };
});
const gestationalWeek = computed(() => gestationalInfo.value.week);
const gestationalDay = computed(() => gestationalInfo.value.day);
const estimatedDueDate = computed(() => gestationalInfo.value.dueDate);


// --- 日历计算 ---
const calendarDays = computed<CalendarDay[]>(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const days: CalendarDay[] = [];

  const startDayOfWeek = firstDayOfMonth.getDay();
  for (let i = startDayOfWeek; i > 0; i--) {
    days.push(createCalendarDay(new Date(year, month, 1 - i), false));
  }
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    days.push(createCalendarDay(new Date(year, month, i), true));
  }
  const endDayOfWeek = lastDayOfMonth.getDay();
  for (let i = 1; i < 7 - endDayOfWeek; i++) {
    days.push(createCalendarDay(new Date(year, month + 1, i), false));
  }
  return days;
});

// --- Chart.js 配置 ---
const allCompletedRecordsSorted = computed(() => {
    return records.value
        .filter(r => r.end_date)
        .sort((a, b) => {
            const dateA = parseLocalDate(a.start_date);
            const dateB = parseLocalDate(b.start_date);
            if (!dateA || !dateB) return 0;
            return dateA.getTime() - dateB.getTime();
        });
});

const filteredRecordsForChart = computed(() => {
  if (!chartFilter.startDate || !chartFilter.endDate) {
    return allCompletedRecordsSorted.value;
  }
  return allCompletedRecordsSorted.value.filter(r => {
    const recordDate = r.start_date.split('T')[0];
    return recordDate >= chartFilter.startDate && recordDate <= chartFilter.endDate;
  });
});

const chartData = computed(() => {
  const displayedRecords = filteredRecordsForChart.value;

  if (displayedRecords.length === 0) return { labels: [], datasets: [] };

  const labels = displayedRecords.map(r => {
      const d = parseLocalDate(r.start_date);
      return d ? formatLocalDate(d) : '';
  });

  const periodLengths = displayedRecords.map(rec => {
    const start = parseLocalDate(rec.start_date);
    const end = parseLocalDate(rec.end_date);
    if (!start || !end) return 0;
    return (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;
  });

  const cycleLengths = displayedRecords.map(currentRecord => {
      const recordIndexInGlobalList = allCompletedRecordsSorted.value.findIndex(r => r.id === currentRecord.id);
      if (recordIndexInGlobalList > 0) {
          const prevRecord = allCompletedRecordsSorted.value[recordIndexInGlobalList - 1];
          const currentStart = parseLocalDate(currentRecord.start_date);
          const prevStart = parseLocalDate(prevRecord.start_date);
          if (currentStart && prevStart) {
              return (currentStart.getTime() - prevStart.getTime()) / (1000 * 3600 * 24);
          }
      }
      return null; // No predecessor found or it's the first record ever
  });

  return {
    labels: labels,
    datasets: [
      {
        label: '周期长度 (天)',
        backgroundColor: 'rgba(13, 110, 253, 0.7)',
        borderColor: '#0d6efd',
        data: cycleLengths,
        yAxisID: 'y',
        barPercentage: 0.5,
        categoryPercentage: 0.7,
      },
      {
        label: '经期长度 (天)',
        backgroundColor: 'rgba(220, 53, 69, 0.7)',
        borderColor: '#dc3545',
        data: periodLengths,
        yAxisID: 'y1',
        barPercentage: 0.5,
        categoryPercentage: 0.7,
      }
    ]
  };
});
const chartOptions: import('chart.js').ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          size: 14,
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
        },
        color: '#333'
      }
    },
    title: {
      display: true,
      text: '周期与经期长度趋势',
      font: {
        size: 18,
        family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
      },
      color: '#333',
      padding: {
        top: 10,
        bottom: 20
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        size: 14,
        weight: 'bold',
      },
      bodyFont: {
        size: 12,
      },
      callbacks: {
        title: (tooltipItems: TooltipItem<'bar'>[]) => `周期开始于: ${tooltipItems[0].label}`,
        label: (context: TooltipItem<'bar'>) => {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += `${context.parsed.y} 天`;
          }
          return label;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#555',
        font: {
          size: 12
        }
      }
    },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      beginAtZero: false,
      min: 15, // 周期长度一般不会低于15
      title: {
        display: true,
        text: '周期长度 (天)',
        color: '#0d6efd',
        font: {
          size: 14,
          weight: 'bold'
        }
      },
      grid: {
        color: '#e9e9e9',
      },
      ticks: {
        color: '#0d6efd',
      }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      beginAtZero: true,
      max: 15, // 经期长度一般不会超过15
      title: {
        display: true,
        text: '经期长度 (天)',
        color: '#dc3545',
        font: {
          size: 14,
          weight: 'bold'
        }
      },
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        color: '#dc3545',
      }
    }
  }
};

// --- 方法 ---
const createCalendarDay = (date: Date, isCurrentMonth: boolean): CalendarDay => {
  const dateStr = formatLocalDate(date);
  const day: CalendarDay = {
    date, isCurrentMonth,
    isToday: date.getTime() === today.getTime(),
    isSelected: selectedDate.value?.getTime() === date.getTime(),
    isPeriod: records.value.some(r => {
      const start = parseLocalDate(r.start_date);
      if (!start) return false;
      const endValue = parseLocalDate(r.end_date);
      const end = endValue ? endValue : (activePeriod.value?.id === r.id ? today : start);
      return date >= start && date <= end;
    }),
    isPredictedPeriod: false, isFertile: false, isOvulation: false,
    isSexDay: sexLogs.value.some(log => log.log_date === dateStr),
  };

  if (prediction.value && !isPregnancyMode.value) {
    const predStart = parseLocalDate(prediction.value.nextPeriodStartDate);
    if (!predStart) return day; // Exit if prediction start date is invalid
    const predEnd = new Date(predStart);
    predEnd.setDate(predStart.getDate() + (prediction.value.averagePeriodLength || 7) - 1);
    day.isPredictedPeriod = date >= predStart && date <= predEnd;
    const fertileStart = parseLocalDate(prediction.value.fertileWindow.start);
    const fertileEnd = parseLocalDate(prediction.value.fertileWindow.end);
    if (fertileStart && fertileEnd) {
      day.isFertile = date >= fertileStart && date <= fertileEnd;
    }
    day.isOvulation = dateStr === prediction.value.ovulationDate;
  }
  return day;
};

const getDayClasses = (day: CalendarDay) => ({
  'bg-gray-50 text-gray-400': !day.isCurrentMonth, 'bg-blue-100': day.isToday,
  'ring-2 ring-blue-500': day.isSelected, 'bg-red-100': day.isPeriod,
  'bg-red-50': day.isPredictedPeriod && !day.isPeriod && !isPregnancyMode.value,
  'bg-purple-100': day.isOvulation && !isPregnancyMode.value,
  'bg-pink-100': day.isFertile && !day.isOvulation && !isPregnancyMode.value,
});

const fetchData = async () => {
  try {
    const apiCalls = [apiRequest('/periods', 'GET'), apiRequest('/sex', 'GET')];
    // 仅在正常模式下请求预测数据
    if (!isPregnancyMode.value) {
      apiCalls.push(apiRequest('/periods/predict', 'GET'));
    }
    const results = await Promise.all(apiCalls);
    records.value = results[0] || [];
    sexLogs.value = results[1] || [];
    prediction.value = results.length > 2 ? results[2] : null;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    toastStore.showToast({ message: '数据加载失败', type: 'error' });
  }
};

const selectDate = (date: Date) => {
  selectedDate.value = date;
  // 重置编辑状态
  editingRecord.value = null;

  // 如果在正常模式下，检查是否有经期记录以进入编辑模式
  if (!isPregnancyMode.value) {
    const recordOnDate = records.value.find(r => {
      const start = parseLocalDate(r.start_date);
      if (!start) return false;
      const endValue = parseLocalDate(r.end_date);
      const end = endValue ? endValue : (activePeriod.value?.id === r.id ? today : start);
      return date >= start && date <= end;
    });
    if (recordOnDate) {
      const startDate = parseLocalDate(recordOnDate.start_date);
      const endDate = parseLocalDate(recordOnDate.end_date);
      editingRecord.value = { ...recordOnDate };
      form.value = {
        start_date: startDate ? formatLocalDate(startDate) : '',
        end_date: endDate ? formatLocalDate(endDate) : '',
        pain_level: recordOnDate.pain_level || '无',
        flow_volume: recordOnDate.flow_volume || '正常',
        notes: recordOnDate.notes || '',
        color: recordOnDate.color || null,
        state: recordOnDate.state || null,
      };
    }
  }

  // 更新私密记录表单
  const log = sexLogOnSelectedDate.value;
  sexLogForm.value.protection_method = log ? log.protection_method || null : null;
};

const handleStartPeriod = async () => {
  if (activePeriod.value) return toastStore.showToast({ message: '已有进行中的经期', type: 'warning' });
  const startDate = selectedDate.value ? formatLocalDate(selectedDate.value) : formatLocalDate(today);
  try {
    await apiRequest('/periods', 'POST', { start_date: startDate });
    toastStore.showToast({ message: '经期开始记录成功', type: 'success' });
    await fetchData();
    const newStartDate = parseLocalDate(startDate);
    if (newStartDate) selectDate(newStartDate);
  } catch (error) {
    console.error('Failed to start period:', error);
    toastStore.showToast({ message: '记录失败', type: 'error' });
  }
};

const handleEndPeriod = async () => {
  if (!activePeriod.value) return toastStore.showToast({ message: '没有进行中的经期', type: 'warning' });
  const endDate = selectedDate.value ? formatLocalDate(selectedDate.value) : formatLocalDate(today);
  try {
    await apiRequest(`/periods/${activePeriod.value.id}`, 'PUT', { end_date: endDate });
    toastStore.showToast({ message: '经期结束记录成功', type: 'success' });
    await fetchData();
    const newEndDate = parseLocalDate(endDate);
    if (newEndDate) selectDate(newEndDate);
  } catch (error) {
    console.error('Failed to end period:', error);
    toastStore.showToast({ message: '记录失败', type: 'error' });
  }
};

const updateRecord = async () => {
  if (!editingRecord.value) return;
  try {
    await apiRequest(`/periods/${editingRecord.value.id}`, 'PUT', { ...form.value, end_date: form.value.end_date || null });
    toastStore.showToast({ message: '记录更新成功', type: 'success' });
    await fetchData();
    cancelEdit();
  } catch (error) {
    console.error('Failed to update record:', error);
    toastStore.showToast({ message: '更新失败', type: 'error' });
  }
};

const deleteRecord = async () => {
  if (!editingRecord.value || !confirm('确定要删除这个经期周期吗？此操作不可撤销。')) return;
  try {
    await apiRequest(`/periods/${editingRecord.value.id}`, 'DELETE');
    toastStore.showToast({ message: '删除成功', type: 'success' });
    await fetchData();
    cancelEdit();
    selectedDate.value = null; // 删除后清空选择
  } catch (error) {
    console.error('Failed to delete record:', error);
    toastStore.showToast({ message: '删除失败', type: 'error' });
  }
};

const createSexLog = async () => {
  if (!selectedDate.value) return;
  const dateStr = formatLocalDate(selectedDate.value);
  try {
    await apiRequest('/sex', 'POST', { log_date: dateStr, protection_method: null });
    toastStore.showToast({ message: '已记录 ❤️', type: 'success' });
    await fetchData();
    selectDate(selectedDate.value);
  } catch (error) {
    console.error('Failed to create sex log:', error);
    toastStore.showToast({ message: '操作失败', type: 'error' });
  }
};

const saveSexLog = async () => {
  if (!selectedDate.value || !sexLogOnSelectedDate.value) return;
  try {
    await apiRequest('/sex', 'POST', { log_date: formatLocalDate(selectedDate.value), protection_method: sexLogForm.value.protection_method });
    toastStore.showToast({ message: '保护措施已保存', type: 'success' });
    await fetchData();
  } catch (error) {
    console.error('Failed to save sex log:', error);
    toastStore.showToast({ message: '保存失败', type: 'error' });
  }
};

const deleteSexLog = async () => {
  if (!selectedDate.value || !confirm('确定要删除这一天的爱爱记录吗？')) return;
  try {
    await apiRequest(`/sex/${formatLocalDate(selectedDate.value)}`, 'DELETE');
    toastStore.showToast({ message: '记录已删除', type: 'success' });
    await fetchData();
    selectDate(selectedDate.value);
  } catch (error) {
    console.error('Failed to delete sex log:', error);
    toastStore.showToast({ message: '删除失败', type: 'error' });
  }
};

const cancelEdit = () => {
  editingRecord.value = null;
};

const prevMonth = () => { currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() - 1)); };
const nextMonth = () => { currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() + 1)); };

const toggleMode = () => {
  isPregnancyMode.value = !isPregnancyMode.value;
  // 切换模式后重新获取数据，特别是预测数据
  fetchData();
};

// --- 生命周期钩子 ---
onMounted(() => {
  fetchData();
  // 设置图表筛选器默认时间为最近一年
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  chartFilter.startDate = formatLocalDate(start);
  chartFilter.endDate = formatLocalDate(end);
});
</script>
