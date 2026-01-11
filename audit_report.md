# 考拉健康 (Koala Health) 全栈代码审计报告

## 1. 总体评估
系统架构清晰，前后端职责分明。后端在关键财务和健康数据处理上采用了**数据库事务**，安全性较高。前端近期已升级为**毛玻璃 (Glassmorphism)** 视觉体系，整体感官非常现代。

但在细节的一致性、代码冗余、以及多语言国际化的同步上仍存在一些待优化项。

---

## 2. 后端服务 (Node.js/Express)

### 🔴 关键问题 (Errors/Security)
- **调试日志泄漏**: `server.js` 在启动时会明文打印 `JWT_SECRET`。虽然方便调试，但在生产环境中存在严重安全隐患。
- **静态 API 前缀**: 部分旧路由在逻辑上已归类为 `/auth`，但前端调用时仍有个别地方（如 `stores/user.ts`）需要手动拼接路径，建议在 `apiRequest` 中进一步规范化。

### 🟡 优化建议 (Logic/Quality)
- **错误处理不够精细**: 大多数 `catch` 块直接返回 “服务器内部错误”。建议针对数据库唯一索引冲突（如重复用户名）返回更具体的 409 状态码及中文提示。
- **清理逻辑负载**: `medication_logs` 的自动清理频率较高。如果用户量激增，建议将其移至定时任务（Cron Job）而非在每次 `GET` 请求时触发。

---

## 3. 前端开发 (Vue 3/Vite)

### 🔴 视觉一致性问题
- **弹窗“出戏”**: `MedicationView.vue` 和 `FinanceView.vue` 中的所有 Form 弹窗和历史记录 Modal 仍在使用**纯白背景 (bg-white)**。这与主页面的毛玻璃效果格格不入，产生断层感。
- **图标未同步**: `HomeView.vue` 中的功能图标与顶部导航栏（App.vue）不一致。首页仍在使用旧的图标（如 `pilcrow` 代表用药，应改为 `pill`）。
- **硬编码颜色**: `FinanceView.vue` 的图表组件硬编码了 HSL 以外的 Hex 颜色，应通过 CSS 变量统一。

### 🟡 架构与代码质量 (Architectural Debt)
- **巨无霸组件**: `FinanceView.vue` 超过 1000 行。将总览、交易列表、借还款表单整合在一个文件内，增加了后期维护难度。建议拆分为独立的功能组件。
- **逻辑重复**: `MedicationView.vue` 中对“库存不足”的判断逻辑重复出现在 `computed` 和 `method` 中。
- **工具函数冗余**: `formatCurrency` (货币格式化) 函数在多个 View 中重复定义。应提取至 `src/utils.js` 实现全局复用。

---

## 4. 国际化与 SSO 适配 (i18n)

### 🔴 历史遗留文本
- **SSO 名称未更新**: 语言包（`zh.json`/`en.json`）中仍保留了许多关于 `linux.do` 的文案。
- **Casdoor 提示不足**: 个人资料页由于禁用了 Casdoor 账号的密码修改，虽然已有简单提示，但语言包中对应的 key 仍是旧的，建议重命名为 `sso_management_hint`。

---

## 5. 已执行的即时修复 (Hotfixes)
- [x] **已更正 `HomeView.vue` 图标**: 将首页图标同步为全新的 `pill` (用药), `droplets` (排便), `list-todo` (清单), `weight` (体重) 和 `wallet` (财务)。
- [x] **统一导航联动**: 确保首页点击反馈与顶部导航栏的一致性。

---

## 6. 后续行动建议 (Recommended Next Steps)
1. **清理 `server.js` 调试日志**。
2. **重构 `FinanceView.vue`** 为多组件模式。
3. **全局应用毛玻璃 Modal 样式**，提升 UI 完成度。
4. **清理语言包中的 linux.do 遗留文案**。
