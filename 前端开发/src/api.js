/**
 * @file src/api.js
 * @description 通用的API请求函数，用于与后端进行交互。
 *
 * - 自动从 localStorage 读取 authToken 并附加到请求头中。
 * - 统一处理网络请求和错误。
 * - 支持 GET, POST, PUT, DELETE 等方法。
 * - 自动处理 JSON 格式的请求体和响应。
 */

// 从全局 window 对象读取运行时配置，如果未定义则回退到本地开发环境地址
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3000';

/**
 * 通用的API请求函数。
 * @param {string} endpoint - API 的端点路径 (例如, '/login')。
 * @param {string} [method='GET'] - HTTP 请求方法。
 * @param {object|null} [body=null] - 请求体数据。
 * @returns {Promise<any>} - 返回从 API 获取的数据。
 * @throws {Error} - 如果 API 响应不成功，则抛出包含错误信息的 Error 对象。
 */
export const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    // 尝试解析JSON错误体，如果失败则使用通用错误信息
    const errorData = await response.json().catch(() => ({ message: `请求失败，状态码: ${response.status}` }));
    throw new Error(errorData.message || '服务器响应异常');
  }

  // 处理没有响应体的成功请求 (例如 204 No Content)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  return response.json();
};
