<template>
  <div
    class="w-full max-w-md mx-auto p-6 md:p-8 relative text-gray-800 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg"
  >
    <div class="absolute top-4 right-4 md:top-6 md:right-6">
      <button
        @click="openModal"
        class="text-gray-500 hover:text-gray-800 transition-colors duration-200"
        title="设置"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          ></path>
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          ></path>
        </svg>
      </button>
    </div>
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-800">番茄钟</h1>
      <p class="text-lg text-teal-400 mt-2">{{ sessionStatusText }}</p>
    </div>

    <!-- Timer Display -->
    <div class="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto mb-8">
      <svg class="w-full h-full" viewBox="0 0 100 100">
        <circle
          class="text-gray-200 stroke-current"
          stroke-width="4"
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
        ></circle>
        <circle
          id="timer-progress"
          class="stroke-current timer-circle-progress"
          :class="progressColorClass"
          stroke-width="4"
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
          stroke-linecap="round"
          transform="rotate(-90 50 50)"
          :style="{ strokeDasharray: 282.74, strokeDashoffset: progressOffset }"
        ></circle>
      </svg>
      <div
        class="absolute inset-0 flex items-center justify-center text-5xl sm:text-6xl font-bold tracking-wider"
      >
        {{ formattedTime }}
      </div>
    </div>

    <!-- Controls -->
    <div class="flex justify-center items-center space-x-4">
      <button
        @click="handleStartPause"
        class="w-32 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg transform hover:scale-105"
      >
        {{ isRunning ? '暂停' : '开始' }}
      </button>
      <button
        @click="resetTimer"
        class="w-32 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg transform hover:scale-105"
      >
        重置
      </button>
    </div>

    <!-- Pomodoro Counter -->
    <div class="mt-8 text-center">
      <p class="text-gray-500">已完成的番茄钟</p>
      <div class="flex justify-center space-x-2 mt-2">
        <div
          v-for="i in POMODOROS_UNTIL_LONG_BREAK"
          :key="i"
          class="w-4 h-4 rounded-full"
          :class="getDotClass(i)"
        ></div>
      </div>
    </div>

    <!-- Task List -->
    <div class="mt-8 text-left max-w-sm mx-auto">
      <h3 class="text-lg font-semibold text-gray-700 mb-2 text-center">任务列表</h3>
      <div class="flex space-x-2 mb-4">
        <input
          type="text"
          v-model="newTaskText"
          @keypress.enter="addTask"
          class="flex-grow bg-white border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          placeholder="添加新任务..."
        />
        <button
          @click="addTask"
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
        >
          添加
        </button>
      </div>
      <ul class="space-y-2 max-h-40 overflow-y-auto">
        <li v-if="tasks.length === 0" class="text-center text-gray-500 p-3">还没有任务</li>
        <li
          v-for="task in tasks"
          :key="task.id"
          :data-id="task.id"
          @click="setActiveTask(task.id)"
          class="flex items-center justify-between p-3 rounded-md transition-colors duration-200 cursor-pointer"
          :class="[task.id === activeTaskId ? 'bg-blue-100' : 'bg-white hover:bg-gray-50']"
        >
          <div class="flex items-center overflow-hidden">
            <input
              type="checkbox"
              :checked="task.completed"
              @change="toggleTask(task.id)"
              @click.stop
              class="task-checkbox h-5 w-5 rounded bg-gray-100 border-gray-300 text-teal-500 focus:ring-teal-500 cursor-pointer flex-shrink-0"
            />
            <span
              class="ml-3 truncate"
              :class="[task.completed ? 'line-through text-gray-500' : 'text-gray-800']"
              :title="task.text"
              >{{ task.text }}</span
            >
          </div>
          <button
            @click.stop="deleteTask(task.id)"
            class="delete-task-btn text-gray-500 hover:text-red-500 transition-colors duration-200 ml-2 flex-shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </li>
      </ul>
    </div>

    <!-- Settings Modal -->
    <div
      v-if="isSettingsModalOpen"
      class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg p-6 md:p-8 w-full max-w-sm shadow-2xl">
        <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">时间设置</h2>
        <div class="space-y-4">
          <div>
            <label for="pomodoro-duration" class="block text-sm font-medium text-gray-700"
              >专注 (分钟)</label
            >
            <input
              type="number"
              v-model.number="settings.pomodoro"
              id="pomodoro-duration"
              class="mt-1 block w-full bg-white border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              min="1"
            />
          </div>
          <div>
            <label for="short-break-duration" class="block text-sm font-medium text-gray-700"
              >短休息 (分钟)</label
            >
            <input
              type="number"
              v-model.number="settings.shortBreak"
              id="short-break-duration"
              class="mt-1 block w-full bg-white border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              min="1"
            />
          </div>
          <div>
            <label for="long-break-duration" class="block text-sm font-medium text-gray-700"
              >长休息 (分钟)</label
            >
            <input
              type="number"
              v-model.number="settings.longBreak"
              id="long-break-duration"
              class="mt-1 block w-full bg-white border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              min="1"
            />
          </div>
        </div>
        <div class="mt-8 flex justify-end space-x-3">
          <button
            @click="closeModal"
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-md transition-colors duration-200"
          >
            取消
          </button>
          <button
            @click="saveSettings"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors duration-200"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<!--
  @file src/components/PomodoroTimer.vue
  @description 一个功能完备、高度集成的番茄钟（Pomodoro Timer）Vue组件。

  核心功能:
  - **多模式计时器**: 支持“专注”、“短休息”和“长休息”三种会话模式，并能自动在它们之间切换。
  - **可视化进度条**: 使用SVG圆形进度条，直观地展示当前会话的剩余时间。
  - **全面的控制**: 提供“开始”、“暂停”和“重置”功能，方便用户控制计时器。
  - **智能会话周期**: 每完成设定数量（默认为4个）的番茄钟后，自动进入一次长休息，遵循标准的番茄工作法。
  - **集成的任务列表**:
    - 用户可以添加、删除和标记完成任务。
    - 可以将某个任务设置为当前专注的目标，增强目标感。
  - **清晰的状态指示**: 通过一组圆点，清晰地展示在一个长休息周期内已完成的番茄钟数量。
  - **音频反馈**: 在每个会话结束时，使用 Tone.js 播放声音提醒，无需时刻关注屏幕。
  - **高度可配置**: 提供一个设置弹窗，允许用户自定义“专注”、“短休息”和“长休息”的时长。
  - **数据持久化**: 用户的任务列表和当前活动任务ID会自动保存在浏览器的 localStorage 中，刷新页面后不会丢失。
-->
<script setup lang="ts">
/**
 * @description 番茄钟组件的主脚本区域。
 * 负责管理计时器的所有状态、逻辑、用户交互、任务列表功能、设置以及与浏览器的集成（如标题更新、音频播放）。
 */
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import * as Tone from 'tone'

// --- 类型定义 (Interfaces) ---
interface Task {
  id: string;
  text: string;
  completed: boolean;
}

type SessionType = 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK';

// --- 常量与配置 (Constants & Config) ---
/**
 * @description 存储各种会话类型的默认时长（分钟）。
 * 使用 `reactive` 使其能够在用户通过设置弹窗更改后，全局响应更新。
 */
const SESSIONS: Record<SessionType, number> = reactive({
  POMODORO: 25,
  SHORT_BREAK: 5,
  LONG_BREAK: 15,
})
/** @description 会话类型对应的显示文本。 */
const SESSION_TITLES: Record<SessionType, string> = {
  POMODORO: '专注',
  SHORT_BREAK: '短休息',
  LONG_BREAK: '长休息',
}
/** @description 每完成多少个番茄钟后进入一次长休息。 */
const POMODOROS_UNTIL_LONG_BREAK = 4
/** @description SVG圆形进度条的周长，用于计算 `stroke-dashoffset`。 */
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 45

// --- 响应式状态 (State) ---
const timerId = ref<number | null>(null) // `setInterval` 的 ID，用于清除计时器
const timeRemaining = ref(SESSIONS.POMODORO * 60) // 剩余时间（秒）
const currentSession = ref<SessionType>('POMODORO') // 当前会话类型
const pomodorosCompleted = ref(0) // 已完成的番茄钟总数
const isRunning = ref(false) // 计时器是否正在运行

// 任务列表相关状态
const tasks = ref<Task[]>([])
const activeTaskId = ref<string | null>(null) // 当前专注的任务ID
const newTaskText = ref('')

// 设置弹窗相关状态
const isSettingsModalOpen = ref(false)
const settings = reactive({
  pomodoro: SESSIONS.POMODORO,
  shortBreak: SESSIONS.SHORT_BREAK,
  longBreak: SESSIONS.LONG_BREAK,
})

// --- 计算属性 (Computed Properties) ---

/**
 * @computed formattedTime
 * @description 将剩余的秒数 `timeRemaining` 格式化为 'MM:SS' 格式的字符串。
 * @returns {string} 格式化后的时间字符串。
 */
const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60)
    .toString()
    .padStart(2, '0')
  const seconds = (timeRemaining.value % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
})

/**
 * @computed progressOffset
 * @description 计算SVG圆形进度条的 `stroke-dashoffset` 值，以实现平滑的进度动画。
 * @returns {number} 计算出的偏移量。
 */
const progressOffset = computed(() => {
  const totalDuration = SESSIONS[currentSession.value] * 60
  const progress = (totalDuration - timeRemaining.value) / totalDuration
  return CIRCLE_CIRCUMFERENCE * (1 - progress)
})

/**
 * @computed progressColorClass
 * @description 根据当前的会话类型 (`currentSession`)，返回对应的 Tailwind CSS 颜色类。
 * @returns {string} 颜色相关的CSS类名。
 */
const progressColorClass = computed(() => {
  switch (currentSession.value) {
    case 'POMODORO':
      return 'text-teal-500'
    case 'SHORT_BREAK':
      return 'text-green-500'
    case 'LONG_BREAK':
      return 'text-blue-500'
    default:
      return 'text-teal-500'
  }
})

/**
 * @computed sessionStatusText
 * @description 生成并返回显示在计时器上方的状态文本。
 * - 在专注模式下，如果设置了活动任务，则显示 "专注: {任务文本}"。
 * - 否则，显示通用的会话标题，如 "专注时间！" 或 "短休息时间！"。
 * @returns {string} 当前的状态文本。
 */
const sessionStatusText = computed(() => {
  const activeTask = tasks.value.find((task) => task.id === activeTaskId.value)
  if (currentSession.value === 'POMODORO') {
    return activeTask && !activeTask.completed ? `专注: ${activeTask.text}` : '专注时间！'
  }
  return `${SESSION_TITLES[currentSession.value]}时间！`
})

// --- 核心计时器功能 (Core Timer Functions) ---

/**
 * @function updateTitle
 * @description 更新浏览器标签页的标题，以实时显示剩余时间和当前会话状态。
 */
function updateTitle() {
  document.title = `${formattedTime.value} - ${SESSION_TITLES[currentSession.value]}`
}

/**
 * @function playSound
 * @description 在会话切换时，使用 Tone.js 库播放一声清脆的提示音。
 * 包含错误处理，以防音频上下文无法创建。
 */
function playSound() {
  try {
    const synth = new Tone.Synth().toDestination()
    synth.triggerAttackRelease('C5', '8n', Tone.now())
    synth.triggerAttackRelease('G5', '8n', Tone.now() + 0.2)
  } catch (e) {
    console.error('Audio could not be played.', e)
  }
}

/**
 * @function setSession
 * @description 设置并初始化一个新的会话。
 * @param {SessionType} sessionType - 要开始的新会话类型。
 */
function setSession(sessionType: SessionType) {
  currentSession.value = sessionType
  timeRemaining.value = SESSIONS[sessionType] * 60
  updateTitle()
}

/**
 * @function startTimer
 * @description 启动计时器。如果计时器当前未运行，则设置一个新的 `setInterval`。
 */
function startTimer() {
  if (!isRunning.value) {
    isRunning.value = true
    timerId.value = window.setInterval(timerTick, 1000);
  }
}

/**
 * @function switchSession
 * @description 在不同的会话类型之间进行切换。
 * - 如果当前是专注时间，则增加已完成的番茄钟数量，并根据数量决定进入短休息还是长休息。
 * - 如果当前是休息时间，则切换回专注时间。
 * 切换后会播放提示音并自动开始下一轮计时。
 */
function switchSession() {
  if (currentSession.value === 'POMODORO') {
    pomodorosCompleted.value++
    if (pomodorosCompleted.value % POMODOROS_UNTIL_LONG_BREAK === 0) {
      setSession('LONG_BREAK')
    } else {
      setSession('SHORT_BREAK')
    }
  } else {
    setSession('POMODORO')
  }
  playSound()
  startTimer()
}

/**
 * @function timerTick
 * @description 计时器的核心逻辑，每秒由 `setInterval` 调用一次。
 * - 减少剩余时间。
 * - 更新浏览器标题。
 * - 当时间归零时，清除计时器并触发会话切换。
 */
function timerTick() {
  if (timeRemaining.value > 0) {
    timeRemaining.value--
    updateTitle()
  } else {
    if (timerId.value !== null) {
      clearInterval(timerId.value)
    }
    isRunning.value = false
    switchSession()
  }
}

// --- 控制功能 (Control Functions) ---

/**
 * @function pauseTimer
 * @description 暂停当前正在运行的计时器。
 */
function pauseTimer() {
  if (isRunning.value) {
    isRunning.value = false
    if (timerId.value !== null) {
      clearInterval(timerId.value)
    }
  }
}

/**
 * @function handleStartPause
 * @description 处理“开始/暂停”按钮的点击事件，根据当前状态调用 `startTimer` 或 `pauseTimer`。
 */
function handleStartPause() {
  if (isRunning.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

/**
 * @function resetTimer
 * @description 重置计时器，将其恢复到初始的“专注”会话状态。
 */
function resetTimer() {
  pauseTimer()
  setSession('POMODORO')
}

// --- UI 更新功能 (UI Update Functions) ---

/**
 * @function getDotClass
 * @description 根据已完成的番茄钟数量，为状态指示圆点返回正确的CSS类。
 * @param {number} index - 当前圆点的索引（从1开始）。
 * @returns {string} Tailwind CSS 背景色类。
 */
function getDotClass(index: number) {
  const completedInCycle = pomodorosCompleted.value % POMODOROS_UNTIL_LONG_BREAK
  const isLongBreakCycle = completedInCycle === 0 && pomodorosCompleted.value > 0
  const dotsToShow = isLongBreakCycle ? POMODOROS_UNTIL_LONG_BREAK : completedInCycle

  if (index <= dotsToShow) {
    if (isLongBreakCycle && currentSession.value !== 'LONG_BREAK' && pomodorosCompleted.value > 0) {
      return 'bg-blue-500'
    }
    return 'bg-teal-500'
  }
  return 'bg-gray-200'
}

// --- 任务列表功能 (Task List Functions) ---

/**
 * @function saveTasks
 * @description 将当前的任务列表 (`tasks`) 和活动任务ID (`activeTaskId`) 保存到浏览器的 localStorage 中，以实现数据持久化。
 */
function saveTasks() {
  localStorage.setItem('pomodoro_tasks', JSON.stringify(tasks.value))
  if (activeTaskId.value) {
    localStorage.setItem('pomodoro_activeTaskId', activeTaskId.value)
  } else {
    localStorage.removeItem('pomodoro_activeTaskId')
  }
}

/**
 * @function loadTasks
 * @description 从 localStorage 中加载之前保存的任务数据，并恢复到组件的状态中。
 */
function loadTasks() {
  const storedTasks = localStorage.getItem('pomodoro_tasks')
  if (storedTasks) {
    tasks.value = JSON.parse(storedTasks) as Task[]
  }
  const storedActiveTaskId = localStorage.getItem('pomodoro_activeTaskId')
  activeTaskId.value = storedActiveTaskId || null
}

/**
 * @function addTask
 * @description 添加一个新任务到任务列表。
 */
function addTask() {
  const text = newTaskText.value.trim()
  if (text) {
    const newTask: Task = { id: Date.now().toString(), text, completed: false }
    tasks.value.push(newTask)
    newTaskText.value = ''
    saveTasks()
  }
}

/**
 * @function toggleTask
 * @description 切换指定ID任务的完成状态。
 * @param {string} id - 要切换状态的任务ID。
 */
function toggleTask(id: string) {
  tasks.value = tasks.value.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task,
  )
  saveTasks()
}

/**
 * @function deleteTask
 * @description 从任务列表中删除指定ID的任务。
 * @param {string} id - 要删除的任务ID。
 */
function deleteTask(id: string) {
  tasks.value = tasks.value.filter((task) => task.id !== id)
  if (activeTaskId.value === id) {
    activeTaskId.value = null
  }
  saveTasks()
}

/**
 * @function setActiveTask
 * @description 将指定ID的任务设置为当前的活动（专注）任务。
 * @param {string} id - 要设为活动任务的任务ID。
 */
function setActiveTask(id:string) {
  activeTaskId.value = id
  saveTasks()
}

// --- 设置弹窗功能 (Settings Modal Functions) ---

/**
 * @function openModal
 * @description 打开设置弹窗，并将当前的会话时长填充到表单中。
 */
function openModal() {
  settings.pomodoro = SESSIONS.POMODORO
  settings.shortBreak = SESSIONS.SHORT_BREAK
  settings.longBreak = SESSIONS.LONG_BREAK
  isSettingsModalOpen.value = true
}

/**
 * @function closeModal
 * @description 关闭设置弹窗。
 */
function closeModal() {
  isSettingsModalOpen.value = false
}

/**
 * @function saveSettings
 * @description 保存用户在设置弹窗中做的更改，更新 `SESSIONS` 常量，
 * 然后重置计时器以应用新的时长设置。
 */
function saveSettings() {
  if (settings.pomodoro > 0 && settings.shortBreak > 0 && settings.longBreak > 0) {
    SESSIONS.POMODORO = settings.pomodoro
    SESSIONS.SHORT_BREAK = settings.shortBreak
    SESSIONS.LONG_BREAK = settings.longBreak

    pauseTimer()
    pomodorosCompleted.value = 0
    setSession('POMODORO')

    closeModal()
  } else {
    // 可以在这里添加用户提示，例如使用 toast
    console.error('Please enter valid minute values greater than 0.')
  }
}

// --- 生命周期钩子 (Lifecycle Hooks) ---
/**
 * @description 组件挂载后执行的初始化操作：
 * 1. 从 localStorage 加载任务。
 * 2. 初始化计时器的剩余时间。
 * 3. 更新浏览器标题。
 * 4. 如果尚未授权，则请求浏览器桌面通知权限。
 */
onMounted(() => {
  loadTasks()
  timeRemaining.value = SESSIONS.POMODORO * 60
  updateTitle()
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission()
  }
})

/**
 * @description 组件卸载时执行的清理操作，确保清除 `setInterval`，防止内存泄漏。
 */
onUnmounted(() => {
  if (timerId.value !== null) {
    clearInterval(timerId.value)
  }
})
</script>

<style scoped>
.timer-circle-progress {
  transition: stroke-dashoffset 1s linear;
}
</style>
