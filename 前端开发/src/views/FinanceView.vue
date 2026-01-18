<!--
  @file src/views/FinanceView.vue
  @description “个人记账”页面，一个功能全面的个人财务管理中心。

  核心功能:
  - **多视图架构**: 通过 `dashboard`(总览), `transactions`(交易明细), `loans`(借还款) 三个视图清晰地组织财务信息。
  - **账户管理**: 支持添加和管理多个资金账户（如现金、银行卡、支付宝等），并实时展示其余额。
  - **收支记录**: 详细记录每一笔收入和支出，包括关联账户、分类、金额、日期和备注。
  - **借贷跟踪**: 专业地管理“借出”和“借入”款项，支持部分还款、查看还款历史、删除还款记录等复杂操作，确保账目清晰。
  - **智能总览**: 在总览页自动计算并展示总资产、总借出、总借入、净资产等关键财务指标。
  - **数据可视化**: 利用 Chart.js 将指定日期范围内的收支情况以柱状图形式呈现，使财务状况一目了然。
  - **历史追溯**: 提供按日期范围搜索历史交易的功能，方便对账和回顾。
-->
<script setup lang="ts">
/**
 * @description 个人记账页面的主脚本区域。
 * 负责管理所有财务数据（账户、交易、借贷）的状态，处理所有相关的业务逻辑（增删改查、还款、图表生成），
 * 以及控制多视图和表单的显示状态。
 */
import { ref, onMounted, computed, nextTick } from 'vue'
import { getTodayDateString, formatCurrency } from '../utils'
import { apiRequest } from '../api'
import { useToastStore } from '@/stores/toast'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, type TooltipItem, type ChartData } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

declare const lucide: { createIcons: () => void };

// --- 类型定义 (Interfaces) ---
interface Account {
  id: number;
  account_name: string;
  current_balance: number;
}

interface Transaction {
  id: number;
  account_id: number;
  transaction_type: 'income' | 'expense';
  amount: number;
  category: string;
  notes: string;
  transaction_date: string;
  account_name?: string;
}

interface Loan {
  id: number;
  loan_type: 'borrow' | 'lend';
  person_name: string;
  amount: number;
  notes: string;
  loan_date: string;
  status: 'unpaid' | 'paid';
  total_repaid: number;
  remaining_amount: number;
  repayment_date?: string;
}

interface Repayment {
    id: number;
    loan_id: number;
    amount: number;
    repayment_date: string;
    account_name: string;
}

// --- 响应式状态 (State) ---

const toastStore = useToastStore()

// --- 核心数据状态 ---
// 存储所有资金账户
const accounts = ref<Account[]>([])
// 存储最近的交易记录（用于列表显示）
const transactions = ref<Transaction[]>([])
// 存储所有借贷记录
const loans = ref<Loan[]>([])
// 存储所有交易记录（用于图表计算）
const allTransactionsForChart = ref<Transaction[]>([])

// --- UI 控制状态 ---
// 当前显示的主视图
const currentView = ref<'dashboard' | 'transactions' | 'loans'>('dashboard')
// 当前显示的添加表单类型
const showForm = ref<'account' | 'transaction' | 'loan' | null>(null)
// 是否显示还款表单
const showRepayForm = ref(false)
// 是否显示还款历史弹窗
const showHistoryModal = ref(false)
// 是否展开交易历史搜索区域
const showTransactionSearch = ref(false)
// 搜索操作是否正在进行中
const isSearching = ref(false)

// --- 数据模型与搜索参数 ---
// 新建账户的表单数据
const newAccount = ref({ account_name: '', initial_balance: 0 })
// 新建交易的表单数据
const newTransaction = ref({
  account_id: null as number | null,
  transaction_type: 'expense' as 'income' | 'expense',
  amount: null as number | null,
  category: '',
  notes: '',
  transaction_date: getTodayDateString(),
})
// 新建借贷的表单数据
const newLoan = ref({
  loan_type: 'lend' as 'borrow' | 'lend',
  person_name: '',
  amount: null as number | null,
  notes: '',
  loan_date: getTodayDateString(),
  account_id: null as number | null,
})
// 还款表单的数据
const repayLoanData = ref({ id: null as number | null, person_name: '', remaining_amount: 0, amount: null as number | null, account_id: null as number | null, repayment_date: getTodayDateString() })
// 交易历史的搜索参数
const transactionSearchParams = ref({ startDate: '', endDate: '' })
// 交易历史的搜索结果
const searchedTransactions = ref<Transaction[] | null>(null)
// 还款历史弹窗中正在查看的借贷对象
const historyLoan = ref<Loan | null>(null)
// 指定借贷的还款历史记录
const repaymentHistory = ref<Repayment[]>([])

// --- 图表相关状态 ---
// Chart.js 的数据对象
const chartData = ref<ChartData<'bar'> | null>(null)
// 图表数据的日期范围参数
const chartParams = ref({
  startDate: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0]
})
// Chart.js 的配置选项
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { stacked: false },
    y: { stacked: false },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: function(context: TooltipItem<'bar'>) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
  }
}


// --- 计算属性 (Computed) ---

/**
 * @computed totalAssets
 * @description 计算所有账户的当前余额之和。
 * @returns {number} 总资产。
 */
const totalAssets = computed(() =>
  accounts.value.reduce((sum, acc) => sum + Number(acc.current_balance), 0),
)
/**
 * @computed totalLend
 * @description 计算所有状态为“未还清”的“借出”款项的总额。
 * @returns {number} 总借出金额。
 */
const totalLend = computed(() =>
  loans.value
    .filter((l) => l.loan_type === 'lend' && l.status === 'unpaid')
    .reduce((sum, l) => sum + Number(l.amount), 0),
)
/**
 * @computed totalBorrow
 * @description 计算所有状态为“未还清”的“借入”款项的总额。
 * @returns {number} 总借入金额。
 */
const totalBorrow = computed(() =>
  loans.value
    .filter((l) => l.loan_type === 'borrow' && l.status === 'unpaid')
    .reduce((sum, l) => sum + Number(l.amount), 0),
)
/**
 * @computed netAssets
 * @description 计算净资产，公式为：总资产 + 总借出 - 总借入。
 * @returns {number} 净资产。
 */
const netAssets = computed(() => totalAssets.value + totalLend.value - totalBorrow.value)

// --- 方法 (Methods) ---

/**
 * @function loadAllFinanceData
 * @description 统一加载所有核心财务数据。
 * 使用 `Promise.all` 并行获取账户、交易和借贷数据，以提高加载效率。
 * 数据加载完毕后，调用 `updateChart` 更新图表。
 */
const loadAllFinanceData = async () => {
  try {
    await Promise.all([loadAccounts(), loadTransactions(), loadLoans()]);
    // 确保在所有数据加载完毕后，再根据默认日期范围更新图表
    updateChart();
  } finally {
    nextTick(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons()
    })
  }
}

/**
 * @function loadAccounts
 * @description 从API加载所有资金账户列表。
 */
const loadAccounts = async () => {
  accounts.value = await apiRequest('/finance/accounts')
}
/**
 * @function loadTransactions
 * @description 从API加载所有交易记录。
 * - `allTransactionsForChart` 会存储所有记录，用于图表分析。
 * - `transactions` 只存储最新的10条，用于在“交易明细”视图中默认显示。
 */
const loadTransactions = async () => {
  const all = await apiRequest('/finance/transactions?limit=all');
  if (all) {
    allTransactionsForChart.value = all;
    transactions.value = all.slice(0, 10);
  } else {
    allTransactionsForChart.value = [];
    transactions.value = [];
  }
}
/**
 * @function loadLoans
 * @description 从API加载所有借贷记录。
 */
const loadLoans = async () => {
  loans.value = await apiRequest('/finance/loans')
}

/**
 * @function addAccount
 * @description 提交并添加一个新账户。
 * 成功后会重新加载账户列表并关闭表单。
 */
const addAccount = async () => {
  if (!newAccount.value.account_name) {
    toastStore.showToast({ message: '账户名称不能为空', type: 'error' })
    return
  }
  await apiRequest('/finance/accounts', 'POST', newAccount.value)
  toastStore.showToast({ message: '账户已添加' })
  await loadAccounts()
  showForm.value = null
  newAccount.value = { account_name: '', initial_balance: 0 }
}

/**
 * @function addTransaction
 * @description 提交并添加一笔新交易。
 * 成功后会重新加载所有财务数据并关闭表单。
 */
const addTransaction = async () => {
  if (!newTransaction.value.account_id || !newTransaction.value.amount) {
    toastStore.showToast({ message: '账户和金额为必填项', type: 'error' })
    return
  }
  await apiRequest('/finance/transactions', 'POST', newTransaction.value)
  toastStore.showToast({ message: '交易已记录' })
  await loadAllFinanceData()
  showForm.value = null
  newTransaction.value = {
    account_id: null,
    transaction_type: 'expense',
    amount: null,
    category: '',
    notes: '',
    transaction_date: getTodayDateString(),
  }
}

/**
 * @function addLoan
 * @description 提交并添加一笔新借贷记录。
 * 成功后会重新加载所有财务数据并关闭表单。
 */
const addLoan = async () => {
  if (!newLoan.value.person_name || !newLoan.value.amount || !newLoan.value.account_id) {
    toastStore.showToast({ message: '对方姓名、金额和关联账户为必填项', type: 'error' })
    return
  }
  await apiRequest('/finance/loans', 'POST', newLoan.value)
  toastStore.showToast({ message: '借贷已记录' })
  await loadAllFinanceData()
  showForm.value = null
  newLoan.value = {
    loan_type: 'lend',
    person_name: '',
    amount: null,
    notes: '',
    loan_date: getTodayDateString(),
    account_id: null,
  }
}

/**
 * @function deleteTransaction
 * @description 删除一笔指定的交易记录。
 * 成功后会重新加载所有财务数据以同步余额。
 * @param {Transaction} transaction - 要删除的交易对象。
 */
const deleteTransaction = async (transaction: Transaction) => {
  if (!confirm(`确定要删除这笔交易吗？\n(${transaction.category || '交易'} - ${formatCurrency(transaction.amount)})`)) return;
  try {
    await apiRequest(`/finance/transactions/${transaction.id}`, 'DELETE');
    toastStore.showToast({ message: '交易已删除' });
    await loadAllFinanceData();
  } catch (error) {
    if (error instanceof Error) {
      toastStore.showToast({ message: `删除失败: ${error.message}`, type: 'error' });
    }
  }
};

/**
 * @function deleteLoan
 * @description 删除一笔指定的借贷记录。
 * 后端会级联删除所有关联的还款记录和交易明细。
 * 成功后会重新加载所有财务数据。
 * @param {Loan} loan - 要删除的借贷对象。
 */
const deleteLoan = async (loan: Loan) => {
  if (!confirm(`确定要删除这笔与 ${loan.person_name} 的借贷记录吗？其关联的所有还款记录也会被一并删除。`)) return;
  try {
    await apiRequest(`/finance/loans/${loan.id}`, 'DELETE');
    toastStore.showToast({ message: '借贷记录已删除' });
    await loadAllFinanceData();
  } catch (error) {
    if (error instanceof Error) {
      toastStore.showToast({ message: `删除失败: ${error.message}`, type: 'error' });
    }
  }
};

/**
 * @function showRepaymentHistory
 * @description 从API获取指定借贷的所有还款记录，并在弹窗中显示。
 * @param {Loan} loan - 要查看历史的借贷对象。
 */
const showRepaymentHistory = async (loan: Loan) => {
  historyLoan.value = loan;
  try {
    repaymentHistory.value = await apiRequest(`/finance/loans/${loan.id}/repayments`);
    showHistoryModal.value = true;
  } catch (error) {
    if (error instanceof Error) {
      toastStore.showToast({ message: `获取还款历史失败: ${error.message}`, type: 'error' });
    }
    repaymentHistory.value = [];
  }
};

/**
 * @function deleteRepayment
 * @description 删除一笔指定的还款记录。
 * 这是一个复杂操作，后端会同步删除关联的交易明细。
 * 成功后，会重新加载所有财务数据以确保状态完全同步，并刷新当前弹窗内的还款历史。
 * @param {Repayment} repayment - 要删除的还款对象。
 */
const deleteRepayment = async (repayment: Repayment) => {
  if (!confirm(`确定要删除这笔 ${new Date(repayment.repayment_date).toLocaleDateString()} 的还款记录吗？金额为 ${formatCurrency(repayment.amount)}。\n此操作也会删除关联的交易明细。`)) return;
  if (!historyLoan.value) return;
  try {
    await apiRequest(`/finance/repayments/${repayment.id}`, 'DELETE');
    toastStore.showToast({ message: '还款记录已删除' });

    const currentLoanId = historyLoan.value.id;

    // 重新加载所有财务数据，以确保账户余额、借贷状态等完全同步
    await loadAllFinanceData();

    // 重新获取当前借贷的还款历史
    const updatedHistory = await apiRequest(`/finance/loans/${currentLoanId}/repayments`);
    repaymentHistory.value = updatedHistory || []; // 确保它是一个数组

    // 如果删除后历史记录为空，则关闭弹窗
    if (repaymentHistory.value.length === 0) {
        showHistoryModal.value = false;
    }

  } catch (error) {
    if (error instanceof Error) {
      toastStore.showToast({ message: `删除失败: ${error.message}`, type: 'error' });
    }
  }
};


/**
 * @function openRepayForm
 * @description 打开还款表单，并根据传入的借贷对象预填充表单数据。
 * @param {Loan} loan - 准备为其还款的借贷对象。
 */
const openRepayForm = (loan: Loan) => {
  repayLoanData.value = {
    id: loan.id,
    person_name: loan.person_name,
    remaining_amount: loan.remaining_amount,
    amount: null,
    account_id: null,
    repayment_date: getTodayDateString()
  };
  showRepayForm.value = true;
};

/**
 * @function repayLoan
 * @description 提交还款表单，执行还款操作。
 * 成功后会重新加载所有财务数据并关闭表单。
 */
const repayLoan = async () => {
  const { id, amount, account_id, repayment_date } = repayLoanData.value;
  if (!amount || !account_id) {
    toastStore.showToast({ message: '还款金额和账户为必填项', type: 'error' });
    return;
  }
  try {
    await apiRequest(`/finance/loans/${id}/repay`, 'POST', { amount, account_id, repayment_date });
    toastStore.showToast({ message: '还款成功' });
    await loadAllFinanceData();
    showRepayForm.value = false;
  } catch (error) {
    if (error instanceof Error) {
      toastStore.showToast({ message: `还款失败: ${error.message}`, type: 'error' });
    }
  }
};

/**
 * @function searchTransactions
 * @description 根据用户选择的日期范围，从API搜索历史交易记录。
 */
const searchTransactions = async () => {
  const { startDate, endDate } = transactionSearchParams.value;
  if (!startDate || !endDate) {
    toastStore.showToast({ message: '请选择开始和结束日期', type: 'error' });
    return;
  }
  isSearching.value = true;
  try {
    const params = new URLSearchParams({ startDate, endDate }).toString();
    searchedTransactions.value = await apiRequest(`/finance/transactions?${params}`);
  } catch (error) {
    if (error instanceof Error) {
      toastStore.showToast({ message: `查询失败: ${error.message}`, type: 'error' });
    }
    searchedTransactions.value = [];
  } finally {
    isSearching.value = false;
  }
};


/**
 * @function updateChart
 * @description 根据 `chartParams` 中选定的日期范围，处理 `allTransactionsForChart` 数据并更新图表。
 * 过程包括：
 * 1. 初始化日期范围内的每一天的数据结构。
 * 2. 遍历所有交易，将金额累加到对应日期的收入或支出中。
 * 3. 生成 Chart.js 所需的 `labels` 和 `datasets`。
 */
const updateChart = () => {
  const startDate = new Date(chartParams.value.startDate)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(chartParams.value.endDate)
  endDate.setHours(23, 59, 59, 999)

  const dailyData: { [date: string]: { income: number; expense: number } } = {}

  // Initialize days in the range
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateString = d.toISOString().split('T')[0]
    dailyData[dateString] = { income: 0, expense: 0 }
  }

  // Populate with transaction data
  allTransactionsForChart.value.forEach(t => {
    const transactionDate = new Date(t.transaction_date)
    if (transactionDate >= startDate && transactionDate <= endDate) {
      const dateString = transactionDate.toISOString().split('T')[0]
      if (dailyData[dateString]) {
        if (t.transaction_type === 'income') {
          dailyData[dateString].income += Number(t.amount)
        } else {
          dailyData[dateString].expense += Number(t.amount)
        }
      }
    }
  })

  const sortedDates = Object.keys(dailyData).sort()

  chartData.value = {
    labels: sortedDates.map(d => {
      const date = new Date(d)
      return `${date.getMonth() + 1}/${date.getDate()}`
    }),
    datasets: [
      {
        label: '收入',
        backgroundColor: '#4ade80', // green-400
        data: sortedDates.map(d => dailyData[d].income),
      },
      {
        label: '支出',
        backgroundColor: '#f87171', // red-400
        data: sortedDates.map(d => dailyData[d].expense),
      },
    ],
  }
}

// --- 生命周期钩子 (Lifecycle Hooks) ---
/**
 * @description 组件挂载后，调用 `loadAllFinanceData` 初始化所有财务数据。
 */
onMounted(loadAllFinanceData)
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-4xl mobile-px-0">
    <header class="mb-6">
      <div class="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl shadow border border-white/20">
        <h1 class="text-2xl font-bold">个人记账</h1>
        <p class="text-gray-500 mt-1">清晰掌握您的财务状况</p>
      </div>
    </header>

    <!-- 导航 -->
    <div
      class="flex items-center justify-between bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-md mb-6 border border-white/20"
    >
      <button
        @click="currentView = 'dashboard'"
        :class="{ 'bg-blue-500 text-white': currentView === 'dashboard' }"
        class="flex-1 py-2 px-4 rounded-lg"
      >
        总览
      </button>
      <button
        @click="currentView = 'transactions'"
        :class="{ 'bg-blue-500 text-white': currentView === 'transactions' }"
        class="flex-1 py-2 px-4 rounded-lg"
      >
        交易明细
      </button>
      <button
        @click="currentView = 'loans'"
        :class="{ 'bg-blue-500 text-white': currentView === 'loans' }"
        class="flex-1 py-2 px-4 rounded-lg"
      >
        借还款
      </button>
    </div>

    <!-- 总览视图 -->
    <div v-if="currentView === 'dashboard'">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mobile-grid-1">
        <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow border">
          <p class="text-sm text-gray-500">总资产</p>
          <p class="text-2xl font-bold">{{ formatCurrency(totalAssets) }}</p>
        </div>
        <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow border">
          <p class="text-sm text-gray-500">总借出</p>
          <p class="text-2xl font-bold text-green-600">{{ formatCurrency(totalLend) }}</p>
        </div>
        <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow border">
          <p class="text-sm text-gray-500">总借入</p>
          <p class="text-2xl font-bold text-red-600">{{ formatCurrency(totalBorrow) }}</p>
        </div>
        <div class="md:col-span-3 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow border">
          <p class="text-sm text-gray-500">净资产 (总资产 + 总借出 - 总借入)</p>
          <p class="text-3xl font-bold text-blue-600">{{ formatCurrency(netAssets) }}</p>
        </div>
      </div>
      <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">我的账户</h2>
          <button
            @click="showForm = 'account'"
            class="bg-blue-500 text-white py-1 px-3 rounded-lg text-sm"
          >
            添加账户
          </button>
        </div>
        <ul class="space-y-2">
          <li
            v-for="acc in accounts"
            :key="acc.id"
            class="flex justify-between items-center p-2 bg-gray-50 rounded-md"
          >
            <span>{{ acc.account_name }}</span>
            <span class="font-semibold">{{ formatCurrency(acc.current_balance) }}</span>
          </li>
        </ul>
      </div>

      <!-- 收支图表分析 -->
      <div class="mt-6 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border">
        <h2 class="text-xl font-semibold mb-2">收支图表分析</h2>

        <!-- 日期选择 -->
        <div class="flex flex-wrap items-center gap-4 mb-4">
          <div>
            <label for="chart-start-date" class="text-sm font-medium text-gray-700">开始日期</label>
            <input type="date" id="chart-start-date" v-model="chartParams.startDate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
          </div>
          <div>
            <label for="chart-end-date" class="text-sm font-medium text-gray-700">结束日期</label>
            <input type="date" id="chart-end-date" v-model="chartParams.endDate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
          </div>
          <div class="self-end">
            <button @click="updateChart" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              更新图表
            </button>
          </div>
        </div>

        <!-- 图表 -->
        <div class="relative h-64 md:h-80 overflow-x-auto">
          <div v-if="chartData" class="min-w-[600px] md:min-w-0 h-full">
            <Bar :data="chartData" :options="chartOptions" />
          </div>
          <div v-if="!chartData" class="flex items-center justify-center h-full text-gray-500">
            加载图表数据中...
          </div>
        </div>
      </div>
    </div>

    <!-- 交易明细视图 -->
    <div v-if="currentView === 'transactions'">
      <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">交易明细</h2>
          <button
            @click="showForm = 'transaction'"
            class="bg-blue-500 text-white py-1 px-3 rounded-lg text-sm"
          >
            记录一笔
          </button>
        </div>
        <ul class="space-y-3">
          <li
            v-for="t in transactions"
            :key="t.id"
            class="flex justify-between items-center p-3 bg-gray-50 rounded-md"
          >
            <div>
              <p class="font-semibold">
                {{ t.category || (t.transaction_type === 'income' ? '收入' : '支出') }}
              </p>
              <p class="text-xs text-gray-500">
                {{ new Date(t.transaction_date).toLocaleDateString() }} · {{ t.account_name }}
              </p>
              <p v-if="t.notes" class="text-xs text-gray-500 mt-1">备注: {{ t.notes }}</p>
            </div>
            <div class="flex items-center gap-3">
              <p
                class="font-bold text-right"
                :class="t.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'"
              >
                {{ t.transaction_type === 'income' ? '+' : '-' }} {{ formatCurrency(t.amount) }}
              </p>
              <button @click="deleteTransaction(t)" class="text-gray-400 hover:text-red-500 p-1 rounded-full">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </li>
        </ul>

        <!-- 历史记录查询 -->
        <div class="mt-6 border-t pt-4">
          <button @click="showTransactionSearch = !showTransactionSearch" class="text-sm text-blue-600 hover:underline">
            {{ showTransactionSearch ? '收起查询' : '查询历史记录' }}
          </button>
          <div v-if="showTransactionSearch" class="mt-4 p-4 bg-gray-50 rounded-lg">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label class="block text-xs text-gray-600">开始日期</label>
                <input type="date" v-model="transactionSearchParams.startDate" class="w-full p-2 border rounded-md text-sm">
              </div>
              <div>
                <label class="block text-xs text-gray-600">结束日期</label>
                <input type="date" v-model="transactionSearchParams.endDate" class="w-full p-2 border rounded-md text-sm">
              </div>
              <button @click="searchTransactions" :disabled="isSearching" class="bg-blue-500 text-white py-2 px-4 rounded-md text-sm disabled:bg-gray-400">
                {{ isSearching ? '查询中...' : '查询' }}
              </button>
            </div>
            <!-- 查询结果 -->
            <div v-if="searchedTransactions" class="mt-4">
              <h3 class="text-lg font-semibold mb-2">查询结果</h3>
              <p v-if="searchedTransactions.length === 0" class="text-gray-500">在选定日期范围内没有找到交易记录。</p>
              <ul v-else class="space-y-3 max-h-96 overflow-y-auto">
                <li v-for="t in searchedTransactions" :key="`search-${t.id}`" class="flex justify-between items-center p-3 bg-white rounded-md shadow-sm">
                  <div>
                    <p class="font-semibold">{{ t.category || (t.transaction_type === 'income' ? '收入' : '支出') }}</p>
                    <p class="text-xs text-gray-500">{{ new Date(t.transaction_date).toLocaleDateString() }} · {{ t.account_name }}</p>
                    <p v-if="t.notes" class="text-xs text-gray-500 mt-1">备注: {{ t.notes }}</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <p class="font-bold text-right" :class="t.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'">
                      {{ t.transaction_type === 'income' ? '+' : '-' }} {{ formatCurrency(t.amount) }}
                    </p>
                    <button @click="deleteTransaction(t)" class="text-gray-400 hover:text-red-500 p-1 rounded-full">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 借还款视图 -->
    <div v-if="currentView === 'loans'">
      <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">借还款</h2>
          <button
            @click="showForm = 'loan'"
            class="bg-blue-500 text-white py-1 px-3 rounded-lg text-sm"
          >
            添加记录
          </button>
        </div>
        <ul class="space-y-3">
          <li v-for="l in loans" :key="l.id" class="p-3 bg-gray-50 rounded-md">
            <div class="flex justify-between items-start">
              <div>
                <p class="font-semibold">{{ l.person_name }}</p>
                <p class="text-xs text-gray-500">
                  {{ new Date(l.loan_date).toLocaleDateString() }}
                </p>
                <p v-if="l.notes" class="text-xs text-gray-500 mt-1">备注: {{ l.notes }}</p>
              </div>
              <div class="text-right">
                <p
                  class="font-bold"
                  :class="l.loan_type === 'lend' ? 'text-green-600' : 'text-red-600'"
                >
                  {{ l.loan_type === 'lend' ? '借出' : '借入' }} {{ formatCurrency(l.amount) }}
                </p>
                <div v-if="l.status === 'unpaid'" class="text-xs text-orange-500">
                  <p>已还: {{ formatCurrency(l.total_repaid) }}</p>
                  <p>剩余: {{ formatCurrency(l.remaining_amount) }}</p>
                </div>
                <p v-if="l.status !== 'unpaid' && l.repayment_date" class="text-xs text-gray-400">
                  {{ `已于 ${new Date(l.repayment_date).toLocaleDateString()} 还清` }}
                </p>
              </div>
            </div>
            <div class="flex justify-end items-center gap-2 mt-2">
              <button
                v-if="l.status === 'unpaid' && l.total_repaid > 0"
                @click="showRepaymentHistory(l)"
                class="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 py-1 px-3 rounded-md"
              >
                还款历史
              </button>
              <button
                v-if="l.status === 'unpaid'"
                @click="openRepayForm(l)"
                class="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 py-1 px-3 rounded-md"
              >
                还款
              </button>
              <button @click="deleteLoan(l)" class="text-xs bg-red-100 text-red-700 hover:bg-red-200 py-1 px-3 rounded-md">
                删除
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- 添加表单弹窗 -->
    <div
      v-if="showForm"
      @click.self="showForm = null"
      class="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div class="glass-card max-w-md w-full p-8 shadow-2xl relative overflow-hidden animate-slide-up">
        <!-- 添加账户 -->
        <form v-if="showForm === 'account'" @submit.prevent="addAccount" class="space-y-6">
          <h2 class="text-xl font-bold mb-6 flex items-center space-x-2">
            <i data-lucide="plus-circle" class="w-5 h-5 text-blue-500"></i>
            <span>添加新账户</span>
          </h2>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">账户名称</label>
            <input
              v-model="newAccount.account_name"
              type="text"
              required
              placeholder="例如：支付宝、招行卡"
              class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">初始余额</label>
            <input
              v-model.number="newAccount.initial_balance"
              type="number"
              step="0.01"
              required
              class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" @click="showForm = null" class="py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all">
              取消
            </button>
            <button type="submit" class="py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95">
              保存账户
            </button>
          </div>
        </form>

        <!-- 添加交易 -->
        <form v-if="showForm === 'transaction'" @submit.prevent="addTransaction" class="space-y-4">
          <h2 class="text-xl font-bold mb-4 flex items-center space-x-2">
            <i data-lucide="receipt" class="w-5 h-5 text-emerald-500"></i>
            <span>记录一笔交易</span>
          </h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">账务类型</label>
              <select
                v-model="newTransaction.transaction_type"
                class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
              >
                <option value="expense">支出 💸</option>
                <option value="income">收入 💰</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">关联账户</label>
              <select
                v-model.number="newTransaction.account_id"
                required
                class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
              >
                <option :value="null" disabled>请选择</option>
                <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                  {{ acc.account_name }}
                </option>
              </select>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">交易金额</label>
            <input
              v-model.number="newTransaction.amount"
              type="number"
              step="0.01"
              required
              class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">分类</label>
              <input
                v-model="newTransaction.category"
                type="text"
                placeholder="例如：餐饮、房租"
                class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">日期</label>
              <input
                v-model="newTransaction.transaction_date"
                type="date"
                required
                class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">备注</label>
            <textarea
              v-model="newTransaction.notes"
              rows="2"
              class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
            ></textarea>
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" @click="showForm = null" class="py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all">
              取消
            </button>
            <button type="submit" class="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
              立即记账
            </button>
          </div>
        </form>

        <!-- 添加借贷 -->
        <form v-if="showForm === 'loan'" @submit.prevent="addLoan" class="space-y-4">
          <h2 class="text-xl font-bold mb-4 flex items-center space-x-2">
            <i data-lucide="hand-metal" class="w-5 h-5 text-orange-500"></i>
            <span>记录一笔借贷</span>
          </h2>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">借贷模式</label>
            <select v-model="newLoan.loan_type" class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none">
              <option value="lend">借出给别人 ⤴️</option>
              <option value="borrow">从别人处借入 ⤵️</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">对方姓名</label>
              <input
                v-model="newLoan.person_name"
                type="text"
                required
                class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">关联账户</label>
              <select
                v-model.number="newLoan.account_id"
                required
                class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface whitespace-nowrap overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
              >
                <option :value="null" disabled>选择账户</option>
                <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                  {{ acc.account_name }}
                </option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">借贷金额</label>
              <input
                v-model.number="newLoan.amount"
                type="number"
                step="0.01"
                required
                class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">日期</label>
              <input
                v-model="newLoan.loan_date"
                type="date"
                required
                class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">细节说明</label>
            <textarea
              v-model="newLoan.notes"
              rows="2"
              class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
            ></textarea>
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" @click="showForm = null" class="py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all">
              取消
            </button>
            <button type="submit" class="py-3 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95">
              确认记录
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 还款历史弹窗 -->
    <div
      v-if="showHistoryModal"
      @click.self="showHistoryModal = false"
      class="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div v-if="historyLoan" class="glass-card max-w-lg w-full p-8 shadow-2xl relative overflow-hidden animate-slide-up">
        <h3 class="text-xl font-bold mb-6 flex items-center space-x-2">
           <i data-lucide="history" class="w-5 h-5 text-blue-500"></i>
           <span>“{{ historyLoan.person_name }}”的还款历史</span>
        </h3>
        <div v-if="repaymentHistory.length > 0" class="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
          <div v-for="item in repaymentHistory" :key="item.id" class="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
            <div class="space-y-1">
              <p class="font-bold text-emerald-400 text-lg">{{ formatCurrency(item.amount) }}</p>
              <p class="text-[10px] text-on-surface-variant/60 uppercase tracking-widest">日期: {{ new Date(item.repayment_date).toLocaleDateString() }}</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-right">
                <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">账户</p>
                <p class="text-xs font-medium text-on-surface/80">{{ item.account_name }}</p>
              </div>
              <button @click="deleteRepayment(item)" class="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="text-on-surface-variant/40 text-center py-12 flex flex-col items-center">
          <i data-lucide="inbox" class="w-12 h-12 mb-2 opacity-20"></i>
          <p class="text-sm">暂无还款历史记录</p>
        </div>
        <div class="mt-8">
          <button @click="showHistoryModal = false" class="w-full py-3 bg-white/10 hover:bg-white/20 text-on-surface font-bold rounded-2xl transition-all">关闭</button>
        </div>
      </div>
    </div>

    <!-- 部分还款弹窗 -->
    <div
      v-if="showRepayForm"
      @click.self="showRepayForm = false"
      class="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div class="glass-card max-w-md w-full p-8 shadow-2xl relative overflow-hidden animate-slide-up">
        <form @submit.prevent="repayLoan" class="space-y-6">
          <h2 class="text-xl font-bold mb-6 flex items-center space-x-2">
             <i data-lucide="badge-check" class="w-5 h-5 text-blue-500"></i>
             <span>为 "{{ repayLoanData.person_name }}" 还款</span>
          </h2>
          <div class="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-1 leading-none">剩余未还金额</p>
            <p class="text-2xl font-black text-on-surface tracking-tighter">{{ formatCurrency(repayLoanData.remaining_amount) }}</p>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">本次还款金额</label>
            <input
              v-model.number="repayLoanData.amount"
              type="number"
              step="0.01"
              required
              class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
              :max="repayLoanData.remaining_amount"
            />
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">收/付款账户</label>
            <select
              v-model.number="repayLoanData.account_id"
              required
              class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
            >
              <option :value="null" disabled>选择账户</option>
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                {{ acc.account_name }}
              </option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">还款日期</label>
            <input
              v-model="repayLoanData.repayment_date"
              type="date"
              required
              class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" @click="showRepayForm = false" class="py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all">
              取消
            </button>
            <button type="submit" class="py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95">
              确认提交
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
