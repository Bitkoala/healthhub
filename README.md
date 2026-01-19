[简体中文](./README.md) | [English](./README.en.md)

**部署指南**: [简体中文](./DEPLOY_GUIDE.md) | [English](./DEPLOY_GUIDE.en.md)

---

# Koala Health (考拉健康)

  <img src="https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=for-the-badge&logo=vue.js" alt="Vue.js">
  <img src="https://img.shields.io/badge/Node.js-20.x-5FA04E?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Tauri-2.0-24C8D8?style=for-the-badge&logo=tauri" alt="Tauri">
  <img src="https://img.shields.io/badge/Capacitor-Latest-119EFF?style=for-the-badge&logo=capacitor" alt="Capacitor">
  <img src="https://img.shields.io/badge/PWA-Supported-5A0FC8?style=for-the-badge&logo=pwa" alt="PWA">
</p>

<p align="center">
  一个现代、全栈的健康与生活管理平台，助您开启更有条理的健康生活。
</p>

<p align="center">
  <a href="https://jk.bitekaola.com/"><strong>线上体验 &raquo;</strong></a>
</p>

---

**Koala Health (考拉健康)** 是一个一站式的 Web 与 移动端 应用程序，旨在帮助用户轻松记录和管理日常的健康与生活信息。从用药计划到财务状况，从每日任务到运动记录，考拉健康提供了一套全面而直观的工具。

## ✨ 功能亮点

- **全方位健康追踪**:
  - **用药管理**: 记录药品信息、库存，并追踪详细的服药历史。
  - **排便记录**: 使用布里斯托大便分类法，科学记录与分析。
  - **运动日志**: 记录每日的运动项目、时长和强度。
  - **女性健康**: 记录和预测生理周期（经期、易孕期、排卵期），并支持记录疼痛程度、流量等详细信息。
  - **体重管理**: 记录体重、身高，自动计算 BMI 指数，并通过图表追踪体重变化趋势。
  - **私密记录**: 可选择记录某天是否进行了亲密活动，保护个人隐私。
- **一体化生活管理**:
  - **财务记账**: 全功能的个人财务中心。支持多账户管理、收支记录、借贷跟踪（包括部分还款和还款历史），并通过图表进行收支分析。
  - **番茄钟 (Pomodoro)**: 集成番茄工作法计时器，支持自定义专注与休息时长，伴随音效提醒与任务关联。
  - **备忘录 (To-Do)**: 带有优先级的任务清单，助您聚焦重要事项。
  - **每日清单**: 追踪每日习惯和一次性任务的完成情况。
- **智能用药助手 (Medication Assistant)**:
  - **扫码录入**: 集成条形码扫描，自动识别药品信息，简化录入流程。
  - **百科查询**: 内置详尽的药品百科，支持按分类检索（感冒、消炎、心血管等）并查看详细说明。
- **考拉 AI (Koala AI)**:
  - **智能健康助手**: 基于豆包 (Doubao) 大模型构建的 24/7 私人健康顾问。
  - **即时问答**: 支持自然语言交互，解答用药、饮食、运动及疾病相关的健康咨询。
  - **安全合规**: 内置专业医学系统提示词与免责声明，确保回答的安全性与参考价值。
- **全平台原生支持 (Cross-Platform)**:
  - **移动端 (Mobile)**: 集成 **Capacitor**，提供 iOS 与 Android 原生 App，支持触感反馈与刘海屏适配。
  - **桌面端 (Desktop)**: 基于 **Tauri 2.0**，提供极致轻量化（<15MB）的 Windows 与 macOS 原生桌面软件。
  - **离线应用 (PWA)**: 支持安装到桌面与手机桌面，具备基础离线访问能力。
  - **动态开屏 (Dynamic Splash)**: 支持服务端动态下发启动界面，让 App 活动与节日氛围实时更新。
- **现代化用户体验 (Premium UI)**:
  - **极致视觉美学**: 全方位采用 **毛玻璃 (Glassmorphism)** 设计系统，配合动态悬浮光效与 HSL 色彩系统。
  - **多元身份认证**: 支持 **本地账户注册/登录** 以及 **Google、GitHub、Linux.do** 三大主流平台 OAuth 2.0 快捷登录。
  - **智能导航系统**: 适配桌面端的 **顶部悬浮导航** 与 **移动端专属底部导航 (Dock)**，全图标带文字标注。
  - **极致性能**: 毫秒级页面过渡动画，配合数据可视化图表。
  - **多语言与个性化**: 内置中英双语，支持模块化功能定制，打造您的专属健康管家。

## 🚀 两种使用模式：SaaS vs. 自托管

您可以根据对便利性和数据隐私的不同需求，选择最适合您的方式来使用考拉健康：

### 模式一：SaaS 服务 (开箱即用)

这种模式为您提供最便捷的体验。

-   **适合人群**: 希望立即体验核心功能，不介意数据由服务方统一管理的用户。
-   **如何使用**: 直接访问官方演示网站 <a href="https://hb.bitekaola.com/"><strong>https://hb.bitekaola.com/</strong></a> 即可注册使用。
-   **优点**: 无需任何技术背景和服务器，零成本、零配置。

### 模式二：自托管 (完全私有)

这种模式将数据的完全控制权交还给您。

-   **适合人群**: 对数据隐私有较高要求，希望将个人健康、财务等敏感信息存储在自己控制的环境中的用户。
-   **如何使用**: 遵循详细的 **[部署指南 (DEPLOY_GUIDE.md)](./DEPLOY_GUIDE.md)**，将前后端应用完整部署到您自己的服务器上。
-   **优点**:
    -   **数据主权**: 数据 100% 存储在您自己的数据库中，完全由您掌控。
    -   **高度灵活**: 您可以自由修改、定制或扩展应用功能。

## 🛠️ 技术栈

### **前端 (`前端开发`)**
- **框架**: [Vue.js 3](https://vuejs.org/) (Composition API)
- **原生容器 (移动端)**: [Capacitor](https://capacitorjs.com/) (Android / iOS)
- **原生容器 (桌面端)**: [Tauri 2.0](https://tauri.app/) (Win / Mac)
- **构建工具**: [Vite](https://vitejs.dev/)
- **UI 库**: [Tailwind CSS](https://tailwindcss.com/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **自动化**: [GitHub Actions](https://github.com/features/actions)

### **后端 (`后端服务`)**
- **框架**: [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)
- **数据库**: [MySQL](https://www.mysql.com/)
- **核心依赖**: `mysql2`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`

---

## 🚀 本地开发指南

### **1. 准备工作**

-   确保您已安装 [Node.js](https://nodejs.org/) (v20.x 或更高版本) 和 [MySQL](https://www.mysql.com/)。
-   克隆本仓库到本地，并使用 `database_schema.sql` 文件初始化数据库。

### **2. 后端配置与启动**

1.  **进入后端目录**: `cd 后端服务`
2.  **配置环境变量**: 将 `.env.example` 复制为 `.env` 并修改配置。
3.  **安装依赖并启动**:
    ```bash
    npm install
    npm start
    ```

### **3. 前端与移动端配置**

1.  **进入前端目录**: `cd 前端开发`
2.  **安装依赖**: `npm install`
3.  **开发模式**: `npm run dev` (Web)
4.  **移动端同步**:
    ```bash
    npm run mobile:build  # 构建并同步到原生目录
    npx cap open android  # 使用 Android Studio 打开
    ```
5.  **桌面端启动**:
    ```bash
    npm run desktop:dev   # 启动桌面调试版
    npm run desktop:build # 打包桌面安装包
    ```

---

## 部署

项目包含一个 `DEPLOY_GUIDE.md` 文件，其中详细介绍了如何使用 `Nginx` 和 `PM2` 将此项目部署到 Linux 服务器上。
