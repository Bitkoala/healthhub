[简体中文](./README.md) | [English](./README.en.md)

**Deployment Guides**: [简体中文](./DEPLOY_GUIDE.md) | [English](./DEPLOY_GUIDE.en.md)

---

# Koala Health

<p align="center">
  <img src="https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=for-the-badge&logo=vue.js" alt="Vue.js">
  <img src="https://img.shields.io/badge/Node.js-20.x-5FA04E?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express" alt="Express.js">
  <img src="https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql" alt="MySQL">
  <img src="https://img.shields.io/badge/Vite-^5.0-646CFF?style=for-the-badge&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS">
</p>

<p align="center">
  A modern, full-stack health and lifestyle management platform to help you start a more organized and healthy life.
</p>

<p align="center">
  <a href="https://jk.bitekaola.com/"><strong>Live Demo &raquo;</strong></a>
</p>

---

**Koala Health** is a one-stop web application designed to help users easily record and manage their daily health and life information. From medication schedules to financial status, from daily tasks to exercise logs, Koala Health provides a comprehensive and intuitive set of tools.

## ✨ Features

- **Comprehensive Health Tracking**:
  - **Medication Management**: Record drug information, inventory, and track detailed medication history.
  - **Bowel Movement Log**: Use the Bristol Stool Scale for scientific recording and analysis.
  - **Exercise Log**: Record daily exercise items, duration, and intensity.
  - **Women's Health**: Record and predict menstrual cycles (periods, fertile windows, ovulation), with support for detailed symptom logging like pain level and flow.
  - **Weight Management**: Log weight and height, automatically calculate BMI, and track weight trends with a chart.
  - **Intimacy Log**: Optionally log intimate activity on specific days, ensuring personal privacy.
- **Integrated Life Management**:
  - **Financial Accounting**: A full-featured personal finance center. Supports multi-account management, income/expense tracking, loan tracking (including partial repayments and repayment history), and provides income/expense analysis through charts.
  - **Pomodoro Timer**: Integrated Pomodoro method timer with customizable focus/break durations, sound alerts, and task association.
  - **Memo (To-Do)**: A prioritized task list to help you focus on important matters.
  - **Daily Checklist**: Track the completion of daily habits and one-time tasks.
- **Admin Tools**:
  - **User Assistance**: Admins can help users by resetting their passwords.
  - **System Maintenance**: Clean up inactive accounts (and their associated data) that have not logged in for a long time to free up resources.
  - **Privacy Protection**: Administrators cannot view any user's private data, such as passwords, financial records, or health logs. All operations are designed with user privacy as a priority.
- **Modern User Experience (Premium UI)**:
  - **Ultimate Visual Aesthetics**: Full implementation of the **Glassmorphism** design system with dynamic light effects and HSL color systems for a high-end feel.
  - **Diverse Authentication**: Supports **Local Account Registration/Login** and OAuth 2.0快捷登录 for **Google, GitHub, and Linux.do**.
  - **Smart Navigation**: Adaptive **Top Floating Header** for desktop and **Dedicated Bottom Navigation (Dock)** for mobile, ensuring an app-like experience.
  - **Deep Mobile Optimization**: More than just responsive - it's custom-tailored for smartphones with bottom menus, large touch targets, and optimized data grids.
  - **Peak Performance**: Millisecond-level page transitions combined with powerful data visualizations.
  - **Global & Personal**: Built-in multi-language support (i18n) and modular customization to build your personal health steward.

## 🚀 Two Usage Models: SaaS vs. Self-Hosting

You can choose the best way to use Koala Health based on your needs for convenience and data privacy:

### Model 1: SaaS Service (Out-of-the-Box)

This model provides you with the most convenient experience.

-   **Target Audience**: Users who want to experience the core features immediately and don't mind their data being managed by the service provider.
-   **How to Use**: Simply visit the official demo website at <a href="https://hb.bitekaola.com/"><strong>https://hb.bitekaola.com/</strong></a> to register and use.
-   **Advantages**: No technical background or server required, zero cost, zero configuration.
-   **Data Ownership**: Your data will be stored encrypted in the project's demo server database.

### Model 2: Self-Hosting (Completely Private)

This model gives you full control over your data.

-   **Target Audience**: Users with high requirements for data privacy who want to store sensitive personal information such as health and finances in an environment they control.
-   **How to Use**: Follow the detailed **[Deployment Guide (DEPLOY_GUIDE.en.md)](./DEPLOY_GUIDE.en.md)** to deploy the front-end and back-end applications to your own server.
-   **Advantages**:
    -   **Data Sovereignty**: Your data is 100% stored in your own database, completely under your control.
    -   **High Flexibility**: You can freely modify, customize, or extend the application's features.
-   **Data Ownership**: Your data is stored in your own configured private database.

We believe users should have a choice and provide comprehensive support for both needs.

## 🛠️ Tech Stack

### **Frontend (`前端开发`)**
- **Framework**: [Vue.js 3](https://vuejs.org/) (Composition API)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **UI Library**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Routing**: [Vue Router](https://router.vuejs.org/)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **Type Checking**: [TypeScript](https://www.typescriptlang.org/)

### **Backend (`后端服务`)**
- **Framework**: [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)
- **Database**: [MySQL](https://www.mysql.com/)
- **Core Dependencies**: `mysql2`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`

---

## 🚀 Local Development Guide

### **1. Prerequisites**

-   Ensure you have [Node.js](https://nodejs.org/) (v20.x or higher) and [MySQL](https://www.mysql.com/) installed.
-   Clone this repository to your local machine and initialize the database using the `database_schema.sql` file.

### **2. Backend Setup and Launch**

1.  **Navigate to the backend directory**:
    ```bash
    cd 后端服务
    ```

2.  **Configure Environment Variables**: In the `后端服务` directory, copy the `.env.example` file to a new file named `.env`. Then, open the `.env` file and modify the placeholders to match your local environment.

    ```bash
    # Inside the '后端服务' directory
    cp .env.example .env
    ```

    Example content for `.env`:

    ```dotenv
    # --- Database Configuration (MySQL) ---
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=your_password
    DB_DATABASE=health_hub

    # --- Security & Encryption ---
    JWT_SECRET=your_random_secret_string

    # --- Third-Party Auth (OAuth 2.0) ---
    # Google
    GOOGLE_CLIENT_ID=your_google_id
    GOOGLE_CLIENT_SECRET=your_google_secret
    GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

    # GitHub
    GITHUB_CLIENT_ID=your_github_id
    GITHUB_CLIENT_SECRET=your_github_secret
    GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github/callback

    # Linux.do
    LINUX_DO_CLIENT_ID=your_linuxdo_id
    LINUX_DO_CLIENT_SECRET=your_linuxdo_secret
    LINUX_DO_REDIRECT_URI=http://localhost:3000/api/auth/linuxdo/callback

    # --- Frontend Linkage ---
    FRONTEND_URL=http://localhost:5173
    PORT=3000
    CORS_WHITELIST=localhost:5173
    ```

3.  **Install dependencies**:
    ```bash
    npm install
    ```

4.  **Start the backend service**:
    ```bash
    npm start
    ```

    The service will run by default at `http://localhost:3000`.

### **3. Frontend Setup and Launch**

1.  **Navigate to the frontend directory**:
    ```bash
    cd 前端开发
    ```

2.  **Configure API Address**:
    Open the `public/config.js` file and ensure `API_BASE_URL` points to your local backend service.
    ```javascript
    // public/config.js
    window.APP_CONFIG = {
      API_BASE_URL: 'http://localhost:3000/api'
    };
    ```

3.  **Install dependencies**:
    ```bash
    npm install
    ```

4.  **Start the development server**:
    ```bash
    npm run dev
    ```

    The frontend development server will start automatically. You can open the address shown in your browser (usually `http://localhost:5173`) to access it.

---

## Deployment

The project includes a `DEPLOY_GUIDE.en.md` file that details how to deploy this project to a standard Linux cloud server using `Nginx` and `PM2`. Please refer to this file for production deployment guidance.