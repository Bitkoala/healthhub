/**
 * @file /后端服务/authMiddleware.js
 * @description JWT 认证中间件。
 *
 * 负责保护需要用户登录才能访问的路由。
 * 它会从请求的 Authorization 头中提取 Bearer Token，
 * 验证其有效性，并将解码后的用户信息附加到请求对象上。
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config');

const authenticateToken = (req, res, next) => {
    // 1. 从 Authorization 请求头中提取 Token。
    //    标准的 JWT 认证格式为 "Bearer <token>"。
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // 2. 如果请求头中没有 Token，则立即拒绝访问。
    if (token == null) {
        // 401 Unauthorized: 客户端未提供认证凭据。
        return res.sendStatus(401);
    }

    // 3. 验证 Token 的签名和有效期。
    jwt.verify(token, JWT_SECRET, (err, user) => {
        // 如果验证过程中出现错误（如签名不匹配、Token过期等），则拒绝访问。
        if (err) {
            console.error('JWT Verification Error:', err.message);
            // 403 Forbidden: 服务器理解请求，但拒绝授权。
            return res.sendStatus(403);
        }
        // 4. 如果 Token 有效，将解码后的用户信息（payload）附加到请求对象上。
        //    这样，后续的路由处理器就可以通过 `req.user` 访问到用户信息。
        req.user = user;
        // 5. 将控制权传递给下一个中间件或路由处理器。
        next();
    });
};

module.exports = authenticateToken;
    
