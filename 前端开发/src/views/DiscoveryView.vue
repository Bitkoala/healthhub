<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { apiRequest } from '../api'
import { useToastStore } from '@/stores/toast'

// --- Types ---
interface DiseaseCategory {
  id: string;
  name: string;
}

interface KnowledgeCategory {
  id: string;
  name: string;
}

declare const lucide: { createIcons: () => void }

// --- State ---
const activeTab = ref<'disease' | 'knowledge'>('disease')
const toastStore = useToastStore()

// Disease State
const diseaseCategories = ref<DiseaseCategory[]>([])
const selectedDiseaseCategory = ref('')
const diseaseSearchKey = ref('')
const diseaseList = ref<any[]>([])
const isDiseaseLoading = ref(false)

// Knowledge State
const knowledgeCategories = ref<KnowledgeCategory[]>([])
const selectedKnowledgeCategory = ref('')
const knowledgeSearchKey = ref('')
const knowledgeList = ref<any[]>([])
const isKnowledgeLoading = ref(false)

// Detail Modal State
const showDetailModal = ref(false)
const detailType = ref<'disease' | 'knowledge'>('disease')
const detailData = ref<any>(null)
const isDetailLoading = ref(false)

// --- Methods ---

// Initialization
onMounted(() => {
    fetchDiseaseCategories()
    fetchKnowledgeCategories()
    nextTick(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons()
    })
})

// Disease logic
const fetchDiseaseCategories = async () => {
    try {
        const data = await apiRequest('/health-info/disease/categories')
        diseaseCategories.value = data.list || []
    } catch (e) {
        console.error(e)
    }
}

const searchDiseases = async () => {
    isDiseaseLoading.value = true
    try {
        const data = await apiRequest('/health-info/disease/list', 'POST', {
            key: diseaseSearchKey.value,
            classifyId: selectedDiseaseCategory.value
        })
        diseaseList.value = data.list || []
        if (diseaseList.value.length === 0) {
            toastStore.showToast({ message: '未找到相关疾病', type: 'warning' })
        }
        nextTick(() => {
            if (typeof lucide !== 'undefined') lucide.createIcons()
        })
    } catch (e) {
        toastStore.showToast({ message: '搜索失败', type: 'error' })
    } finally {
        isDiseaseLoading.value = false
    }
}

const viewDiseaseDetail = async (id: string) => {
    isDetailLoading.value = true
    detailType.value = 'disease'
    showDetailModal.value = true
    detailData.value = null
    try {
        const data = await apiRequest(`/health-info/disease/detail/${id}`)
        detailData.value = data.item
        nextTick(() => {
            if (typeof lucide !== 'undefined') lucide.createIcons()
        })
    } catch (e) {
        toastStore.showToast({ message: '加载详情失败', type: 'error' })
        showDetailModal.value = false
    } finally {
        isDetailLoading.value = false
    }
}

// Knowledge logic
const fetchKnowledgeCategories = async () => {
    try {
        const data = await apiRequest('/health-info/knowledge/categories')
        knowledgeCategories.value = data.list || []
    } catch (e) {
        console.error(e)
    }
}

const searchKnowledge = async () => {
    isKnowledgeLoading.value = true
    try {
        const data = await apiRequest('/health-info/knowledge/search', 'POST', {
            key: knowledgeSearchKey.value,
            tid: selectedKnowledgeCategory.value
        })
        knowledgeList.value = data.pagebean?.contentlist || []
        if (knowledgeList.value.length === 0) {
            toastStore.showToast({ message: '未找到相关知识', type: 'warning' })
        }
        nextTick(() => {
            if (typeof lucide !== 'undefined') lucide.createIcons()
        })
    } catch (e) {
        toastStore.showToast({ message: '搜索失败', type: 'error' })
    } finally {
        isKnowledgeLoading.value = false
    }
}

const viewKnowledgeDetail = async (id: string) => {
    isDetailLoading.value = true
    detailType.value = 'knowledge'
    showDetailModal.value = true
    detailData.value = null
    try {
        const data = await apiRequest(`/health-info/knowledge/detail/${id}`)
        detailData.value = data.item
        nextTick(() => {
            if (typeof lucide !== 'undefined') lucide.createIcons()
        })
    } catch (e) {
        toastStore.showToast({ message: '加载详情失败', type: 'error' })
        showDetailModal.value = false
    } finally {
        isDetailLoading.value = false
    }
}

// Watchers for immediate filtering
watch(selectedDiseaseCategory, () => {
    if (activeTab.value === 'disease') searchDiseases()
})

watch(selectedKnowledgeCategory, () => {
    if (activeTab.value === 'knowledge') searchKnowledge()
})

</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-4xl min-h-screen pb-24">
    <!-- Header -->
    <header class="mb-8 animate-fade-in">
      <div class="glass-card p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">发现中心</h1>
          <p class="text-on-surface-variant/60 text-sm mt-1">探索疾病百科与健康生活知识</p>
        </div>
        <!-- Tab Switcher -->
        <div class="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-white/10">
          <button 
            @click="activeTab = 'disease'"
            class="px-6 py-2 rounded-xl text-sm font-bold transition-all"
            :class="activeTab === 'disease' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-md' : 'text-gray-500 hover:text-gray-700'"
          >
            疾病查询
          </button>
          <button 
            @click="activeTab = 'knowledge'"
            class="px-6 py-2 rounded-xl text-sm font-bold transition-all"
            :class="activeTab === 'knowledge' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-md' : 'text-gray-500 hover:text-gray-700'"
          >
            健康知识
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="space-y-6 animate-card-in">
        <!-- Search Section -->
        <section class="glass-card p-6">
            <div class="flex flex-col md:flex-row gap-4">
                <!-- Dropdown -->
                <select 
                   v-if="activeTab === 'disease'"
                   v-model="selectedDiseaseCategory"
                   class="md:w-48 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="">全部类别</option>
                    <option v-for="cat in diseaseCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>

                <select 
                   v-if="activeTab === 'knowledge'"
                   v-model="selectedKnowledgeCategory"
                   class="md:w-48 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    <option value="">全部知识</option>
                    <option v-for="cat in knowledgeCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>

                <!-- Search Bar -->
                <div class="flex-1 relative">
                    <input 
                      v-if="activeTab === 'disease'"
                      type="text" 
                      v-model="diseaseSearchKey"
                      placeholder="搜索疾病名称、症状..."
                      class="w-full px-12 py-3 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
                      @keyup.enter="searchDiseases()"
                    >
                    <input 
                      v-else
                      type="text" 
                      v-model="knowledgeSearchKey"
                      placeholder="搜索健康知识关键词..."
                      class="w-full px-12 py-3 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
                      @keyup.enter="searchKnowledge()"
                    >
                    <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40"></i>
                    <button 
                        @click="activeTab === 'disease' ? searchDiseases() : searchKnowledge()"
                        class="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-lg hover:shadow-blue-500/40 transition-all"
                    >
                        GO
                    </button>
                </div>
            </div>
        </section>

        <!-- Results Section -->
        <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Disease Cards -->
            <template v-if="activeTab === 'disease'">
                <div v-if="isDiseaseLoading" class="col-span-full py-20 flex flex-col items-center">
                    <div class="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p class="text-sm opacity-50">正在检索医学库...</p>
                </div>
                <div 
                  v-for="item in diseaseList" 
                  :key="item.id"
                  class="glass-card p-5 hover:bg-white/10 hover:border-blue-500/30 transition-all cursor-pointer group"
                  @click="viewDiseaseDetail(item.id)"
                >
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="text-[10px] uppercase font-bold text-blue-500 tracking-wider mb-1 block">{{ item.categoryName || '普通疾病' }}</span>
                            <h3 class="font-bold text-lg group-hover:text-blue-500 transition-colors">{{ item.name }}</h3>
                            <p class="text-xs text-on-surface-variant/60 mt-1 line-clamp-2 italic leading-relaxed">{{ item.summary || '点击查看诊疗详情内容...' }}</p>
                        </div>
                        <i data-lucide="chevron-right" class="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1"></i>
                    </div>
                </div>
            </template>

            <!-- Knowledge Cards -->
            <template v-if="activeTab === 'knowledge'">
                <div v-if="isKnowledgeLoading" class="col-span-full py-20 flex flex-col items-center">
                    <div class="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p class="text-sm opacity-50">正在为您获取健康科普...</p>
                </div>
                <div 
                  v-for="item in knowledgeList" 
                  :key="item.id"
                  class="glass-card p-5 hover:bg-white/10 hover:border-indigo-500/30 transition-all cursor-pointer group flex flex-col justify-between"
                  @click="viewKnowledgeDetail(item.id || item.link)"
                >
                    <div>
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-bold">{{ item.tname }}</span>
                            <span class="text-[10px] opacity-40">{{ item.time }}</span>
                        </div>
                        <h3 class="font-bold group-hover:text-indigo-500 transition-colors line-clamp-1">{{ item.title }}</h3>
                        <p class="text-xs text-on-surface-variant/60 mt-2 line-clamp-3 leading-loose">{{ item.intro }}</p>
                    </div>
                    <div class="mt-4 flex items-center text-xs font-bold text-indigo-500">
                        <span>阅读详情</span>
                        <i data-lucide="arrow-right" class="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform"></i>
                    </div>
                </div>
            </template>

            <!-- Empty State -->
            <div 
              v-if="(activeTab === 'disease' ? diseaseList.length === 0 && !isDiseaseLoading : knowledgeList.length === 0 && !isKnowledgeLoading)" 
              class="col-span-full py-32 flex flex-col items-center opacity-20"
            >
                <i :data-lucide="activeTab === 'disease' ? 'shield-plus' : 'book-open'" class="w-20 h-20 mb-4"></i>
                <p class="text-lg font-bold">开始您的探索之旅</p>
            </div>
        </section>
    </main>

    <!-- Detail Modal -->
    <Transition name="fade-slide">
        <div v-if="showDetailModal" class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden" @click.self="showDetailModal = false">
            <div class="bg-surface dark:bg-slate-900 w-full max-w-2xl h-[90vh] md:h-auto md:max-h-[85vh] rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
                <!-- Modal Header -->
                <div class="p-6 md:p-8 flex justify-between items-center border-b border-gray-100 dark:border-white/5">
                    <h2 class="text-xl font-bold italic">{{ detailType === 'disease' ? '疾病详情参考' : '健康科普文章' }}</h2>
                    <button @click="showDetailModal = false" class="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>

                <!-- Modal Body -->
                <div class="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar pb-20">
                    <div v-if="isDetailLoading" class="flex flex-col items-center py-20">
                        <div class="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p class="italic opacity-50">正在检索专家库内容...</p>
                    </div>

                    <div v-else-if="detailData" class="space-y-6">
                        <!-- Disease Detail -->
                        <template v-if="detailType === 'disease'">
                            <div class="space-y-4">
                                <h1 class="text-3xl font-black text-blue-600">{{ detailData.name }}</h1>
                                <p class="text-sm opacity-60 leading-relaxed bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border-l-4 border-blue-500">{{ detailData.summary }}</p>
                                
                                <div v-if="detailData.cause" class="space-y-2">
                                    <h4 class="text-lg font-bold flex items-center"><i data-lucide="activity" class="w-5 h-5 mr-2 text-red-500"></i> 病因</h4>
                                    <p class="text-sm leading-loose opacity-80" v-html="detailData.cause"></p>
                                </div>

                                <div v-if="detailData.symptom" class="space-y-2">
                                    <h4 class="text-lg font-bold flex items-center"><i data-lucide="thermometer" class="w-5 h-5 mr-2 text-orange-500"></i> 描述症状</h4>
                                    <p class="text-sm leading-loose opacity-80" v-html="detailData.symptom"></p>
                                </div>

                                <div v-if="detailData.check" class="space-y-2">
                                    <h4 class="text-lg font-bold flex items-center"><i data-lucide="microscope" class="w-5 h-5 mr-2 text-green-500"></i> 检查</h4>
                                    <p class="text-sm leading-loose opacity-80" v-html="detailData.check"></p>
                                </div>

                                <div v-if="detailData.treat" class="space-y-2">
                                    <h4 class="text-lg font-bold flex items-center"><i data-lucide="pill" class="w-5 h-5 mr-2 text-indigo-500"></i> 治疗参考</h4>
                                    <p class="text-sm leading-loose opacity-80" v-html="detailData.treat"></p>
                                </div>
                            </div>
                        </template>

                        <!-- Knowledge Detail -->
                        <template v-if="detailType === 'knowledge'">
                            <div class="space-y-4">
                                <h1 class="text-2xl font-bold text-indigo-600">{{ detailData.title }}</h1>
                                <div class="flex items-center space-x-4 text-xs opacity-40">
                                    <span>分类: {{ detailData.tname }}</span>
                                    <span>发布: {{ detailData.time }}</span>
                                </div>
                                <div class="prose dark:prose-invert max-w-none text-sm leading-loose opacity-80" v-html="detailData.content"></div>
                            </div>
                        </template>
                    </div>
                </div>

                <!-- Sticky Footer -->
                <div class="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-slate-800/50">
                    <button @click="showDetailModal = false" class="w-full py-4 bg-gray-800 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl">
                        阅读完毕
                    </button>
                </div>
            </div>
        </div>
    </Transition>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    @apply bg-blue-500/20 rounded-full;
}

select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1em;
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
