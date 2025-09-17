import type { App } from 'vue'
import { useLanguageStore } from '@/stores/language'

export default {
  install: (app: App) => {
    // 使用 app.config.globalProperties 注册全局属性
    // 注意：这里我们不能直接用 store 实例，因为插件安装时 Pinia 实例可能还未完全准备好
    // 我们提供一个函数，它在使用时会去获取最新的 store 实例
    app.config.globalProperties.$t = (key: string): string => {
      const languageStore = useLanguageStore()
      return languageStore.t(key)
    }
  }
}
