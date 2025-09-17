// /后端服务/routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authenticateToken = require('../authMiddleware');
const axios = require('axios');
const router = express.Router();

// --- 用户认证路由 ---

/**
 * @route   POST /api/auth/register
 * @desc    注册新用户
 * @access  Public
 */
router.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ message: '用户名、密码和邮箱都是必填项。' });
    }

    try {
        // 检查用户名或邮箱是否已存在
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: '用户名或邮箱已被注册。' });
        }

        // 哈希密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 存入数据库
        const [result] = await pool.query(
            'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
            [username, hashedPassword, email]
        );
        
        res.status(201).json({ message: '用户注册成功！', userId: result.insertId });

    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', async (req, res) => {
    // 同时接受 identifier 或 username 作为登录名
    const { identifier, username, password } = req.body;
    const loginIdentifier = identifier || username;

    if (!loginIdentifier || !password) {
        return res.status(400).json({ message: '用户名和密码是必填项。' });
    }

    try {
        // [修复] 同时在 username 和 email 字段中查找登录标识符
        const [users] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ?', [loginIdentifier, loginIdentifier]);
        if (users.length === 0) {
            return res.status(401).json({ message: '无效的用户名或密码。' });
        }

        const user = users[0];

        // [修复] 检查用户是否有密码。如果没有，则可能是通过第三方登录创建的账户。
        if (!user.password_hash) {
            return res.status(401).json({ message: '该账户似乎没有设置密码，请尝试使用第三方登录。' });
        }

        // 比较密码
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: '无效的用户名或密码。' });
        }

        // [修复] 添加检查：确保 JWT_SECRET 已设置
        if (!process.env.JWT_SECRET) {
            console.error('FATAL_ERROR: JWT_SECRET environment variable is not set!');
            return res.status(500).json({ message: '服务器配置错误，请联系管理员。' });
        }

        // 创建并签发 JWT
        const payload = { userId: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: '登录成功！',
            token: token
        });

    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});


/**
 * @route   GET /api/auth/me
 * @desc    获取当前登录用户的信息
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        // We also fetch the password hash to determine if the user has a password set.
        // This is useful for the UI to decide whether to show a "Change Password" option.
        const [rows] = await pool.query('SELECT id, username, email, password_hash, is_admin, show_womens_health FROM users WHERE id = ?', [req.user.userId]);
        if (rows.length > 0) {
            const user = rows[0];
            // The `has_password` flag is dynamically determined.
            const has_password = !!user.password_hash;
            // IMPORTANT: We create a new object to send back, excluding the password hash.
            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                has_password: has_password,
                is_admin: user.is_admin,
                show_womens_health: !!user.show_womens_health
            });
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
});

/**
 * @route   PUT /api/auth/me
 * @desc    更新当前用户的个人资料 (用户名, 邮箱)
 * @access  Private
 */
router.put('/me', authenticateToken, async (req, res) => {
    const { username, email } = req.body;
    const userId = req.user.userId;

    if (!username || !email) {
        return res.status(400).json({ message: '用户名和邮箱不能为空。' });
    }

    try {
        // 检查新的用户名或邮箱是否已被其他用户占用
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?',
            [username, email, userId]
        );
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: '用户名或邮箱已被其他用户占用。' });
        }

        await pool.query(
            'UPDATE users SET username = ?, email = ? WHERE id = ?',
            [username, email, userId]
        );
        
        // 返回更新后的用户信息
        const [updatedUserRows] = await pool.query('SELECT id, username, email, password_hash, is_admin, show_womens_health FROM users WHERE id = ?', [userId]);
        const updatedUser = updatedUserRows[0];
        const has_password = !!updatedUser.password_hash;

        res.json({
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            has_password: has_password,
            is_admin: updatedUser.is_admin,
            show_womens_health: !!updatedUser.show_womens_health
        });

    } catch (error) {
        console.error('更新个人资料失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   PUT /api/auth/me/password
 * @desc    修改当前用户的密码
 * @access  Private
 */
router.put('/me/password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: '当前密码和新密码是必填项。' });
    }

    try {
        const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: '用户不存在。' });
        }

        const user = users[0];

        // 验证当前密码
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: '当前密码不正确。' });
        }

        // 哈希新密码并更新
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedNewPassword, userId]);

        res.json({ message: '密码更新成功！' });

    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});


/**
 * @route   PUT /api/auth/me/settings
 * @desc    更新用户的特定设置
 * @access  Private
 */
router.put('/me/settings', authenticateToken, async (req, res) => {
    const { show_womens_health } = req.body;
    const userId = req.user.userId;

    // 验证输入
    if (typeof show_womens_health !== 'boolean') {
        return res.status(400).json({ message: '无效的设置值。' });
    }

    try {
        await pool.query(
            'UPDATE users SET show_womens_health = ? WHERE id = ?',
            [show_womens_health, userId]
        );
        
        res.json({ message: '设置更新成功！' });

    } catch (error) {
        console.error('更新用户设置失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   GET /api/auth/linuxdo
 * @desc    Redirects user to Linux.do for OAuth authentication.
 * @access  Public
 */
router.get('/linuxdo', (req, res) => {
    const { LINUX_DO_CLIENT_ID, LINUX_DO_REDIRECT_URI, LINUX_DO_AUTHORIZE_URL } = process.env;

    if (!LINUX_DO_CLIENT_ID || !LINUX_DO_REDIRECT_URI || !LINUX_DO_AUTHORIZE_URL) {
        console.error('Linux.do OAuth environment variables are not fully set!');
        return res.status(500).send('Server configuration error: Missing Linux.do OAuth settings.');
    }

    const scope = 'read'; // Assuming 'read' scope is sufficient to get user profile
    const authUrl = `${LINUX_DO_AUTHORIZE_URL}?response_type=code&client_id=${LINUX_DO_CLIENT_ID}&redirect_uri=${LINUX_DO_REDIRECT_URI}&scope=${scope}`;
    
    res.redirect(authUrl);
});


/**
 * @route   GET /api/auth/linuxdo/callback
 * @desc    Handles the OAuth callback from Linux.do.
 * @access  Public
 */
router.get('/linuxdo/callback', async (req, res) => {
    const { code } = req.query;
    const { 
        LINUX_DO_CLIENT_ID, 
        LINUX_DO_CLIENT_SECRET, 
        LINUX_DO_REDIRECT_URI,
        LINUX_DO_TOKEN_URL,
        LINUX_DO_USER_INFO_URL,
        FRONTEND_URL, 
        JWT_SECRET 
    } = process.env;
    const frontendUrl = FRONTEND_URL || 'https://hb.jiankang.mom'; // 为前端URL添加后备选项

    if (!code) {
        return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }

    try {
        // 1. Exchange authorization code for an access token
        const data = new URLSearchParams();
        data.append('grant_type', 'authorization_code');
        data.append('code', code);
        data.append('client_id', LINUX_DO_CLIENT_ID);
        data.append('client_secret', LINUX_DO_CLIENT_SECRET);
        data.append('redirect_uri', LINUX_DO_REDIRECT_URI);

        const tokenResponse = await axios.post(LINUX_DO_TOKEN_URL, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            throw new Error("Access token not received from Linux.do");
        }

        // 2. Use the access token to get user info
        const userResponse = await axios.get(LINUX_DO_USER_INFO_URL, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const linuxdoUser = userResponse.data;
        const { id: linuxdoId, username, email } = linuxdoUser;

        if (!linuxdoId) {
            throw new Error("User ID not received from Linux.do");
        }

        // 3. Find or create a user in your database
        let [users] = await pool.query('SELECT * FROM users WHERE linuxdo_id = ?', [linuxdoId]);
        let user = users[0];

        if (!user) {
            // User doesn't exist, create a new one
            if (email) {
                const [existingEmail] = await pool.query('SELECT * FROM users WHERE email = ? AND linuxdo_id IS NULL', [email]);
                if (existingEmail.length > 0) {
                    return res.redirect(`${frontendUrl}/login?error=email_in_use`);
                }
            }
            
            // To avoid username conflicts, append a suffix.
            const newUsername = `${username}_ldo`;
            const [result] = await pool.query(
                'INSERT INTO users (username, email, linuxdo_id) VALUES (?, ?, ?)',
                [newUsername, email, linuxdoId]
            );
            
            const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
            user = newUser[0];
        }

        // 4. Create a JWT for the user
        const payload = { userId: user.id };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        // 5. Redirect back to the frontend with the token
        res.redirect(`${frontendUrl}/callback.html?token=${token}`);

    } catch (error) {
        console.error('Linux.do OAuth callback error:', error.response ? error.response.data : error.message);
        return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
});

module.exports = router;
