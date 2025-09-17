/**
 * @file /后端服务/server.js
 * @description 后端 Express 服务器主入口文件。
 *
 * 该文件负责：
 * 1. 加载环境变量。
 * 2. 初始化 Express 应用。
 * 3. 配置核心中间件，包括 CORS 和 JSON 解析。
 * 4. 引入并注册所有模块化的 API 路由。
 * 5. 启动服务器并监听指定端口。
 */

// 在文件顶部加载 .env 文件中的环境变量
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// --- 调试代码 ---
// 在服务器启动时，检查 JWT_SECRET 是否已成功加载。
// 请在后端服务的启动日志中查看此输出。
console.log('[DEBUG] JWT_SECRET on startup:', process.env.JWT_SECRET);
// --- 调试代码结束 ---

const express = require('express');
const cors = require('cors');

// --- 路由模块引入 ---
const authRoutes = require('./routes/auth');
const medicationRoutes = require('./routes/medications');
const stoolRoutes = require('./routes/stool');
const dailyRoutes = require('./routes/daily');
const memoRoutes = require('./routes/memos');
const financeRoutes = require('./routes/finance');
const exerciseRoutes = require('./routes/exercise');
const periodRoutes = require('./routes/periods');
const sexRoutes = require('./routes/sex');
const weightRoutes = require('./routes/weight');
const adminRoutes = require('./routes/admin'); // 引入管理员功能路由

// --- Express 应用初始化 ---
const app = express();

// --- 中间件配置 ---

// 1. CORS (跨源资源共享)
// 从环境变量中读取 CORS 白名单，并动态生成正则表达式数组
const whitelistDomains = process.env.CORS_WHITELIST ? process.env.CORS_WHITELIST.split(',') : [];
const whitelist = whitelistDomains.map(domain => {
  // 对域名进行转义，以防域名中包含需要转义的特殊正则字符
  const escapedDomain = domain.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^https?:\/\/([\\w-]+\\.)*${escapedDomain}$`);
});

if (whitelist.length > 0) {
  console.log('[CORS] Whitelist enabled for domains:', whitelistDomains.join(', '));
} else {
  console.warn('[CORS] Warning: No CORS_WHITELIST found in .env file. CORS will block all cross-origin requests.');
}

const corsOptions = {
  origin: (origin, callback) => {
    // 允许来自 Postman、cURL 等非浏览器请求，或满足同源策略的请求
    if (!origin) {
      return callback(null, true);
    }
    // 检查请求源是否匹配白名单中的正则表达式
    const isAllowed = whitelist.some((regex) => regex.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200 // 兼容旧版浏览器
};
app.use(cors(corsOptions));

// 2. JSON 解析器
// 用于解析请求体中的 JSON 格式数据。
app.use(express.json());

// --- API 路由注册 ---
// 将不同的 API 路径前缀映射到对应的路由处理模块。
app.use('/api', authRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/stool-logs', stoolRoutes);
app.use('/api/daily-logs', dailyRoutes);
app.use('/api/memos', memoRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/periods', periodRoutes);
app.use('/api/sex', sexRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/admin', adminRoutes); // 注册管理员功能路由

// --- 服务器启动 ---
const PORT = process.env.PORT || 3000; // 从环境变量读取端口，否则默认为 3000
app.listen(PORT, () => {
  console.log(`后端服务已启动，正在监听端口 ${PORT}`);
});