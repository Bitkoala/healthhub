// /后端服务/config.js

/**
 * 应用程序的配置模块。
 * 从环境变量中加载敏感信息和重要配置，以提高安全性和灵活性。
 */
module.exports = {
    // 用于签发和验证 JSON Web Token (JWT) 的密钥
    JWT_SECRET: process.env.JWT_SECRET,

    // --- Linux.do OAuth 2.0 配置 ---
    // 在 Linux.do 开发者平台申请的应用客户端 ID
    LINUX_DO_CLIENT_ID: process.env.LINUX_DO_CLIENT_ID,
    // 在 Linux.do 开发者平台申请的应用客户端密钥
    LINUX_DO_CLIENT_SECRET: process.env.LINUX_DO_CLIENT_SECRET,
    // Linux.do 授权后重定向回本应用的 URL
    LINUX_DO_REDIRECT_URI: process.env.LINUX_DO_REDIRECT_URI,
    // Linux.do 的授权页面 URL
    LINUX_DO_AUTHORIZE_URL: process.env.LINUX_DO_AUTHORIZE_URL,
    // 用于通过授权码换取 access token 的 URL
    LINUX_DO_TOKEN_URL: process.env.LINUX_DO_TOKEN_URL,
    // 用于通过 access token 获取用户信息的 URL
    LINUX_DO_USER_INFO_URL: process.env.LINUX_DO_USER_INFO_URL
};