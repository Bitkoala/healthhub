/**
 * @file /后端服务/adminMiddleware.js
 * @description 管理员权限验证中间件。
 *
 * 负责检查当前登录的用户是否具有管理员权限。
 * 此中间件应在 `authenticateToken` 中间件之后使用，
 * 因为它依赖于 `req.user` 对象中包含的用户ID。
 */

const pool = require('./db');

/**
 * Express 中间件，用于验证用户是否为管理员。
 * @param {object} req - Express 请求对象 (应包含 `req.user`)。
 * @param {object} res - Express 响应对象。
 * @param {function} next - Express next 中间件函数。
 */
const adminMiddleware = async (req, res, next) => {
    try {
        // 1. 从 `req.user` (由 authenticateToken 设置) 中获取用户ID。
        const userId = req.user.userId;

        // 2. 查询数据库，核实该用户的 `is_admin` 标志。
        const [users] = await pool.query('SELECT is_admin FROM users WHERE id = ?', [userId]);
        const user = users[0];

        // 3. 如果用户不存在或 `is_admin` 不为 true，则拒绝访问。
        if (!user || !user.is_admin) {
            return res.status(403).json({ message: '访问被拒绝：需要管理员权限。' });
        }

        // 4. 用户是管理员，允许访问下一个中间件或路由。
        next();
    } catch (error) {
        console.error('管理员中间件错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
};

module.exports = adminMiddleware;