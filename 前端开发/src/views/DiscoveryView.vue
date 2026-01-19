<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { apiRequest } from '../api'
import { useToastStore } from '@/stores/toast'

// --- Types ---
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  time?: string;
}

declare const lucide: { createIcons: () => void }

// --- State ---
const toastStore = useToastStore()
const messages = ref<Message[]>([
  {
    role: 'assistant',
    content: '你好！我是你的智能健康助手“考拉”。你可以问我关于用药建议、饮食健康、运动方案或任何健康相关的问题。',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
])
const userInput = ref('')
const isLoading = ref(false)
const chatContainer = ref<HTMLElement | null>(null)

// --- Methods ---

/**
 * @function scrollToBottom
 * @description 自动滚动聊天记录到最底部。
 */
const scrollToBottom = async () => {
    await nextTick()
    if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
}

/**
 * @function sendMessage
 * @description 发送消息给 AI 助手。
 */
const sendMessage = async () => {
    if (!userInput.value.trim() || isLoading.value) return

    const userText = userInput.value.trim()
    userInput.value = ''
    
    // 添加用户消息
    messages.value.push({
        role: 'user',
        content: userText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })

    await scrollToBottom()
    isLoading.value = true

    try {
        // 调用后端 AI 接口
        const response = await apiRequest('/ai/chat', 'POST', {
            messages: messages.value.map(m => ({ role: m.role, content: m.content }))
        })

        if (response && response.choices && response.choices[0]) {
            const aiMessage = response.choices[0].message
            messages.value.push({
                role: 'assistant',
                content: aiMessage.content,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })
        } else {
            throw new Error('无效的 AI 响应')
        }
    } catch (error) {
        console.error('AI Assistant Error:', error)
        messages.value.push({
            role: 'assistant',
            content: '抱歉，我现在有点累了，请稍后再试。',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
        toastStore.showToast({ message: '对话发送失败', type: 'error' })
    } finally {
        isLoading.value = false
        await scrollToBottom()
        nextTick(() => {
            if (typeof lucide !== 'undefined') lucide.createIcons()
        })
    }
}

/**
 * @function clearChat
 * @description 清空聊天记录并重置初始欢迎语。
 */
const clearChat = () => {
    messages.value = [
        {
            role: 'assistant',
            content: '已为您清空对话。我是“考拉健康助手”，请问今天有什么可以帮您的？',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]
}

onMounted(() => {
    nextTick(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons()
        scrollToBottom()
    })
})
</script>

<template>
  <div class="h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] flex flex-col bg-gray-50/50 dark:bg-slate-950/20">
    <!-- Header -->
    <header class="p-4 md:p-6 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
      <div class="container mx-auto max-w-4xl flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i data-lucide="sparkles" class="w-6 h-6 text-white"></i>
          </div>
          <div>
            <h1 class="text-lg font-bold">考拉AI</h1>
            <div class="flex items-center space-x-1">
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span class="text-[10px] opacity-40 font-bold uppercase tracking-widest text-green-500">AI Powered</span>
            </div>
          </div>
        </div>
        <button 
          @click="clearChat"
          class="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500"
          title="清空对话"
        >
          <i data-lucide="trash-2" class="w-5 h-5"></i>
        </button>
      </div>
    </header>

    <!-- Chat Area -->
    <main 
      ref="chatContainer"
      class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar"
    >
      <div class="container mx-auto max-w-4xl space-y-6">
        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          class="flex flex-col animate-fade-in"
          :class="msg.role === 'user' ? 'items-end' : 'items-start'"
        >
          <!-- Message Bubble -->
          <div 
            class="max-w-[85%] md:max-w-[75%] p-4 rounded-2xl shadow-sm text-sm"
            :class="msg.role === 'user' 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/5 rounded-tl-none text-gray-800 dark:text-gray-100'"
          >
            <div class="whitespace-pre-wrap leading-relaxed">{{ msg.content }}</div>
            <div 
              class="text-[10px] mt-2 opacity-40"
              :class="msg.role === 'user' ? 'text-right' : 'text-left'"
            >
              {{ msg.time }}
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col items-start animate-fade-in">
          <div class="bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/5 p-4 rounded-2xl rounded-tl-none shadow-sm">
            <div class="flex space-x-2">
              <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Disclaimer -->
    <div class="px-4 py-2 text-center">
        <p class="text-[10px] text-gray-400">注意：AI 助手提供的建议仅供参考，如有身体不适请务必咨询专业医师。</p>
    </div>

    <!-- Input Area -->
    <footer class="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-white/5">
      <div class="container mx-auto max-w-4xl relative">
        <textarea 
          v-model="userInput"
          placeholder="问问我健康相关的问题..."
          rows="1"
          class="w-full pl-6 pr-16 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all resize-none shadow-inner"
          @keydown.enter.prevent="sendMessage"
        ></textarea>
        <button 
          @click="sendMessage"
          :disabled="!userInput.trim() || isLoading"
          class="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
        >
          <i data-lucide="send" class="w-5 h-5"></i>
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    @apply bg-blue-500/10 rounded-full;
}

.animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* 适配移动端输入框不被键盘遮挡的部分 */
@media (max-width: 768px) {
    .h-\[calc\(100vh-64px\)\] {
        height: calc(100vh - 64px - env(safe-area-inset-bottom));
    }
}
</style>
