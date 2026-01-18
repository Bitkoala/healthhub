[简体中文](./README.md) | [English](./README.en.md)

**Deployment Guides**: [简体中文](./DEPLOY_GUIDE.md) | [English](./DEPLOY_GUIDE.en.md)

---

# Koala Health

<p align="center">
  <img src="https://github.com/Bitkoala/healthhub/actions/workflows/android-build.yml/badge.svg" alt="Android Build Status">
  <img src="https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=for-the-badge&logo=vue.js" alt="Vue.js">
  <img src="https://img.shields.io/badge/Node.js-20.x-5FA04E?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express" alt="Express.js">
  <img src="https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql" alt="MySQL">
  <img src="https://img.shields.io/badge/Capacitor-Latest-119EFF?style=for-the-badge&logo=capacitor" alt="Capacitor">
  <img src="https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?style=for-the-badge&logo=githubactions" alt="GitHub Actions">
</p>

<p align="center">
  A modern, full-stack health and lifestyle management platform to help you start a more organized and healthy life.
</p>

<p align="center">
  <a href="https://jk.bitekaola.com/"><strong>Live Demo &raquo;</strong></a>
</p>

---

**Koala Health** is a one-stop Web & Mobile application designed to help users easily record and manage their daily health and life information. From medication schedules to financial status, from daily tasks to exercise logs, Koala Health provides a comprehensive and intuitive set of tools.

## ✨ Features

- **Comprehensive Health Tracking**:
  - **Medication Management**: Record drug information, inventory, and track detailed medication history.
  - **Bowel Movement Log**: Use the Bristol Stool Scale for scientific recording and analysis.
  - **Exercise Log**: Record daily exercise items, duration, and intensity.
  - **Women's Health**: Record and predict menstrual cycles (periods, fertile windows, ovulation).
  - **Weight Management**: Log weight/height, automatically calculate BMI, and track trends.
  - **Intimacy Log**: Optionally log intimate activity on specific days.
- **Integrated Life Management**:
  - **Financial Accounting**: A full-featured personal finance center with account management, income/expense tracking, and debt tracking.
  - **Pomodoro Timer**: Integrated timer with customizable durations and sound alerts.
  - **Memo (To-Do)**: A prioritized task list.
  - **Daily Checklist**: Track daily habits and one-time tasks.
- **Mobile Native Support**:
  - **Cross-Platform**: Powered by **Capacitor**, supporting native **Android** and **iOS** apps.
  - **Enhanced Interaction**: Integrated **Haptic Feedback** for a premium native app feel.
  - **Safe Area Optimization**: Full support for notches and home indicators for an immersive experience.
  - **Automated CI/CD**: Built-in **GitHub Actions** pipeline for automated production APK building and signing.
- **Modern User Experience (Premium UI)**:
  - **Ultimate Visual Aesthetics**: Full **Glassmorphism** design system with dynamic light effects and HSL colors.
  - **Diverse Authentication**: Local registration/login + OAuth 2.0 (Google, GitHub, Linux.do).
  - **Smart Navigation**: Responsive **Floating Header** (Desktop) and **Bottom Navigation Dock** (Mobile).
  - **Peak Performance**: Millisecond-level page transitions and data visualizations.
  - **Global & Personal**: Built-in multi-language (i18n) and modular customization.

## 🚀 Two Usage Models: SaaS vs. Self-Hosting

### Model 1: SaaS Service (Out-of-the-Box)
-   **For**: Users who want to start immediately without technical setup.
-   **URL**: <a href="https://hb.bitekaola.com/"><strong>https://hb.bitekaola.com/</strong></a>

### Model 2: Self-Hosting (Completely Private)
-   **For**: Privacy-conscious users who want 100% data ownership.
-   **Guide**: Follow **[Deployment Guide (DEPLOY_GUIDE.en.md)](./DEPLOY_GUIDE.en.md)**.

## 🛠️ Tech Stack

### **Frontend (`前端开发`)**
- **Framework**: [Vue.js 3](https://vuejs.org/)
- **Native Bridge**: [Capacitor](https://capacitorjs.com/) (Android / iOS)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **UI Library**: [Tailwind CSS](https://tailwindcss.com/)
- **CI/CD**: [GitHub Actions](https://github.com/features/actions)

### **Backend (`后端服务`)**
- **Framework**: [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)
- **Database**: [MySQL](https://www.mysql.com/)

---

## 🚀 Local Development Guide

### **1. Prerequisites**
-   [Node.js](https://nodejs.org/) (v20.x+) & [MySQL](https://www.mysql.com/).

### **2. Backend Setup**
1.  `cd 后端服务`
2.  `cp .env.example .env` and configure.
3.  `npm install && npm start`

### **3. Frontend & Mobile Setup**
1.  `cd 前端开发`
2.  `npm install`
3.  `npm run dev` (Web Dev Server)
4.  **Mobile Sync**:
    ```bash
    npm run mobile:build  # Build & Sync to native
    npx cap open android  # Open in Android Studio
    ```

---

## Deployment
See `DEPLOY_GUIDE.en.md` for Nginx & PM2 production deployment instructions.