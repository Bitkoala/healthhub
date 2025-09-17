

/**
 * @file src/main.js
 * @description Vue 应用的主入口文件。
 *
 * - 引入全局 CSS 样式。
 * - 创建 Vue 应用实例。
 * - 集成 Pinia 进行状态管理。
 * - 集成 Vue Router 进行路由管理。
 * - 将应用挂载到 DOM 的 #app 元素上。
 */

import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './plugins/i18n' // 引入 i18n 插件

const app = createApp(App)

// 注册 Pinia，用于全局状态管理
app.use(createPinia())
// 注册 Vue Router，用于客户端路由
app.use(router)
// 注册 i18n 插件，用于国际化
app.use(i18n)

// 将应用实例挂载到 DOM
app.mount('#app')
