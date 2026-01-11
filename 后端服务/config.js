// /后端服务/config.js

/**
 * 应用程序的配置模块。
 * 从环境变量中加载敏感信息和重要配置，以提高安全性和灵活性。
 */
module.exports = {
    // 用于签发和验证 JSON Web Token (JWT) 的密钥
    JWT_SECRET: process.env.JWT_SECRET,

    // --- Linux.do OAuth 2.0 配置 ---
    LINUX_DO_CLIENT_ID: process.env.LINUX_DO_CLIENT_ID,
    LINUX_DO_CLIENT_SECRET: process.env.LINUX_DO_CLIENT_SECRET,
    LINUX_DO_REDIRECT_URI: process.env.LINUX_DO_REDIRECT_URI,
    LINUX_DO_AUTHORIZE_URL: process.env.LINUX_DO_AUTHORIZE_URL || 'https://connect.linux.do/oauth2/authorize',
    LINUX_DO_TOKEN_URL: process.env.LINUX_DO_TOKEN_URL || 'https://connect.linux.do/oauth2/token',
    LINUX_DO_USER_INFO_URL: process.env.LINUX_DO_USER_INFO_URL || 'https://connect.linux.do/api/user',

    // --- Google OAuth 2.0 配置 ---
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,

    // --- GitHub OAuth 2.0 配置 ---
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GITHUB_REDIRECT_URI: process.env.GITHUB_REDIRECT_URI
};