/**
 * @file src/router/index.js
 * @description 应用的路由配置文件。
 *
 * - 使用 Vue Router 创建路由实例。
 * - 定义所有页面的路由，包括公共页面和需要认证的私有页面。
 * - 使用 `meta: { requiresAuth: true }` 标记需要登录才能访问的路由。
 * - 实现全局前置守卫 (beforeEach) 来处理认证逻辑：
 *   - 如果用户未登录但尝试访问私有页面，则重定向到登录页。
 *   - 登录和回调页面可直接访问。
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import AuthCallback from '../views/AuthCallback.vue'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/auth/callback', name: 'authCallback', component: AuthCallback },
    {
      path: '/meds',
      name: 'meds',
      component: () => import('../views/MedicationView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/stool',
      name: 'stool',
      component: () => import('../views/StoolView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/daily',
      name: 'daily',
      component: () => import('../views/DailyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/memos',
      name: 'memos',
      component: () => import('../views/MemoView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/finance',
      name: 'finance',
      component: () => import('../views/FinanceView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/pomodoro',
      name: 'pomodoro',
      component: () => import('../views/PomodoroView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/discovery',
      name: 'discovery',
      component: () => import('../views/DiscoveryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/exercise',
      name: 'exercise',
      component: () => import('../views/ExerciseView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/periods',
      name: 'periods',
      component: () => import('../views/PeriodTrackerView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/weight',
      name: 'weight',
      component: () => import('../views/WeightView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
})

/**
 * 全局前置守卫 (Navigation Guard) - 重构版
 *
 * 在每次路由跳转之前执行，用于实现认证和授权控制。
 *
 * @param {object} to - 目标路由对象。
 * @param {object} from - 源路由对象。
 * @param {function} next - 控制导航的函数。
 */
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const token = localStorage.getItem('authToken');

  // 规则 1: 恢复会话。
  // 如果 Pinia 中没有登录状态，但 localStorage 中有 token（通常发生在页面刷新后），
  // 则尝试通过 token 从后端获取用户信息来恢复登录状态。
  if (!userStore.isLoggedIn && token) {
    try {
      await userStore.fetchUser();
    } catch {
      // 如果 `fetchUser` 失败（例如 token 过期或无效），store 会自动清理状态。
      // 这里作为双重保险，确保在恢复失败时重定向到登录页。
      return next({ name: 'login' });
    }
  }

  const { isLoggedIn, isAdmin } = userStore;

  // 规则 2: 管理员权限检查。
  // 如果目标路由需要管理员权限 (`meta.requiresAdmin`)。
  if (to.meta.requiresAdmin) {
    if (isLoggedIn && isAdmin) {
      return next(); // 已登录且是管理员 -> 放行。
    }
    // 已登录但非管理员，或未登录 -> 重定向到首页或登录页。
    return next(isLoggedIn ? { name: 'home' } : { name: 'login' });
  }

  // 规则 3: 普通登录认证检查。
  // 如果目标路由需要登录 (`meta.requiresAuth`)。
  if (to.meta.requiresAuth) {
    if (isLoggedIn) {
      return next(); // 已登录 -> 放行。
    }
    return next({ name: 'login' }); // 未登录 -> 重定向到登录页。
  }

  // 规则 4: 公共页面处理。
  // 对于不需要任何权限的页面（如登录页本身），直接放行。
  return next();
});

export default router
