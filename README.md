[简体中文](./README.md) | [English](./README.en.md)

**部署指南**: [简体中文](./DEPLOY_GUIDE.md) | [English](./DEPLOY_GUIDE.en.md)

---

# Koala Health (考拉健康)

<p align="center">
  <img src="https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=for-the-badge&logo=vue.js" alt="Vue.js">
  <img src="https://img.shields.io/badge/Node.js-20.x-5FA04E?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express" alt="Express.js">
  <img src="https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql" alt="MySQL">
  <img src="https://img.shields.io/badge/Vite-^5.0-646CFF?style=for-the-badge&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS">
</p>

<p align="center">
  一个现代、全栈的健康与生活管理平台，助您开启更有条理的健康生活。
</p>

<p align="center">
  <a href="https://pickoala.com/"><strong>线上体验 &raquo;</strong></a>
</p>

---

**Koala Health (考拉健康)** 是一个一站式的 Web 应用程序，旨在帮助用户轻松记录和管理日常的健康与生活信息。从用药计划到财务状况，从每日任务到运动记录，考拉健康提供了一套全面而直观的工具。

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
  - **备忘录 (To-Do)**: 带有优先级的任务清单，助您聚焦重要事项。
  - **每日清单**: 追踪每日习惯和一次性任务的完成情况。
  - **番茄钟 (Pomodoro Timer)**: 一个内置的番茄工作法计时器，帮助您在工作和休息之间找到平衡，提升专注度和效率。
- **管理工具 (Admin Tool)**:
  - **辅助管理**: 管理员可以帮助用户重置密码。
  - **系统维护**: 清理长时间未登录的非活跃账户及其关联数据，释放资源。
  - **隐私保护**: 管理员无法查看用户的密码、财务、健康记录等任何隐私数据，所有操作均以保护用户隐私为前提。
- **现代化用户体验 (Premium UI)**:
  - **极致视觉美学**: 全方位采用 **毛玻璃 (Glassmorphism)** 设计系统，配合动态光效与 HSL 色彩系统，打造高端、精致的视觉感官。
  - **统一身份认证 (Casdoor SSO)**: 集成自托管 **Casdoor** 认证系统，提供安全、便捷的单点登录体验，支持多平台扩展。
  - **灵动导航布局**: 全新的 **顶部悬浮式导航 (Top Floating Header)**，配合精选的功能图标，操作更直观，视野更开阔。
  - **响应式布局**: 完美适配桌面与移动端。
  - **极致性能**: 毫秒级页面过渡动画，配合数据可视化图表。
  - **多语言与个性化**: 内置中英双语，支持模块化功能定制，打造您的专属健康管家。

## 🚀 两种使用模式：SaaS vs. 自托管

您可以根据对便利性和数据隐私的不同需求，选择最适合您的方式来使用考拉健康：

### 模式一：SaaS 服务 (开箱即用)

这种模式为您提供最便捷的体验。

-   **适合人群**: 希望立即体验核心功能，不介意数据由服务方统一管理的用户。
-   **如何使用**: 直接访问官方演示网站 <a href="https://a.joru.email/"><strong>https://a.joru.email/</strong></a> 即可注册使用。
-   **优点**: 无需任何技术背景和服务器，零成本、零配置。
-   **数据归属**: 您的数据将加密存储在项目演示服务器的数据库中。

### 模式二：自托管 (完全私有)

这种模式将数据的完全控制权交还给您。

-   **适合人群**: 对数据隐私有较高要求，希望将个人健康、财务等敏感信息存储在自己控制的环境中的用户。
-   **如何使用**: 遵循详细的 **[部署指南 (DEPLOY_GUIDE.md)](./DEPLOY_GUIDE.md)**，将前后端应用完整部署到您自己的服务器上。
-   **优点**:
    -   **数据主权**: 数据 100% 存储在您自己的数据库中，完全由您掌控。
    -   **高度灵活**: 您可以自由修改、定制或扩展应用功能。
-   **数据归属**: 您的数据存储在您自己配置的私有数据库中。

我们坚信用户应该拥有选择权，并为这两种需求都提供了完善的支持。

## 🛠️ 技术栈

### **前端 (`前端开发`)**
- **框架**: [Vue.js 3](https://vuejs.org/) (Composition API)
- **构建工具**: [Vite](https://vitejs.dev/)
- **UI 库**: [Tailwind CSS](https://tailwindcss.com/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **路由**: [Vue Router](https://router.vuejs.org/)
- **图表**: [Chart.js](https://www.chartjs.org/)
- **类型检查**: [TypeScript](https://www.typescriptlang.org/)

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

1.  **进入后端目录**:
    ```bash
    cd 后端服务
    ```

2.  **配置环境变量**: 将 `后端服务` 目录下的 `.env.example` 文件复制一份并重命名为 `.env`。然后，打开 `.env` 文件并根据您的本地环境修改其中的占位符。

    ```bash
    # 在“后端服务”目录下
    cp .env.example .env
    ```
    
    `.env` 文件内容示例：

    ```dotenv
    # --- 数据库配置 (MySQL) ---
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=your_password
    DB_DATABASE=health_hub

    # --- 安全与加密 ---
    JWT_SECRET=your_random_secret_string

    # --- Casdoor 认证配置 (SSO) ---
    CASDOOR_ENDPOINT=https://your-casdoor-url
    CASDOOR_CLIENT_ID=your_client_id
    CASDOOR_CLIENT_SECRET=your_client_secret
    CASDOOR_ORG_NAME=your_org_name
    CASDOOR_APP_NAME=your_app_name
    CASDOOR_REDIRECT_URI=http://localhost:3000/api/auth/casdoor/callback

    # --- 前端关联配置 ---
    FRONTEND_URL=http://localhost:5173
    PORT=3000
    CORS_WHITELIST=localhost:5173
    ```

3.  **安装依赖**:
    ```bash
    npm install
    ```

4.  **启动后端服务**:
    ```bash
    npm start
    ```

    服务将默认运行在 `http://localhost:3000`。

### **3. 前端配置与启动**

1.  **进入前端目录**:
    ```bash
    cd 前端开发
    ```
    
2.  **配置 API 地址**:
    打开 `public/config.js` 文件，确保 `API_BASE_URL` 指向您的本地后端服务。
    ```javascript
    // public/config.js
    window.APP_CONFIG = {
      API_BASE_URL: 'http://localhost:3000/api'
    };
    ```

3.  **安装依赖**:
    ```bash
    npm install
    ```

4.  **启动开发服务器**:
    ```bash
    npm run dev
    ```

    前端开发服务器将自动启动，您可以在浏览器中打开提示的地址 (通常是 `http://localhost:5173`) 进行访问。

---

## 部署

项目包含一个 `DEPLOY_GUIDE.md` 文件，其中详细介绍了如何使用 `Nginx` 和 `PM2` 将此项目部署到一台标准的 Linux 云服务器上。请参考该文件以获取生产环境的部署指导。
