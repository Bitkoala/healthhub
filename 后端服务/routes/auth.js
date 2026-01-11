// /后端服务/routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authenticateToken = require('../authMiddleware');
const axios = require('axios');
const config = require('../config');
const router = express.Router();

// --- Helper Functions ---
const generateToken = (userId) => {
    return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: '7d' });
};

// --- 用户认证路由 ---

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: '所有字段均为必填项。' });
    }

    try {
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: '用户名或邮箱已存在。' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, password_hash]
        );

        const token = generateToken(result.insertId);
        res.status(201).json({ token, message: '注册成功！' });
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
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: '用户名和密码不能为空。' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
        const user = rows[0];

        if (!user || !user.password_hash) {
            return res.status(401).json({ message: '用户名或密码错误。' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: '用户名或密码错误。' });
        }

        await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

        const token = generateToken(user.id);
        res.json({ token, message: '登录成功！' });
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
        const [rows] = await pool.query('SELECT id, username, email, password_hash, is_admin, show_womens_health FROM users WHERE id = ?', [req.user.userId]);
        if (rows.length > 0) {
            const user = rows[0];
            const has_password = !!user.password_hash;
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
 * @desc    更新当前用户的个人资料
 */
router.put('/me', authenticateToken, async (req, res) => {
    const { username, email } = req.body;
    const userId = req.user.userId;

    if (!username || !email) {
        return res.status(400).json({ message: '用户名和邮箱不能为空。' });
    }

    try {
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

        const [updatedUserRows] = await pool.query('SELECT id, username, email, password_hash, is_admin, show_womens_health FROM users WHERE id = ?', [userId]);
        const updatedUser = updatedUserRows[0];
        res.json({
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            has_password: !!updatedUser.password_hash,
            is_admin: updatedUser.is_admin,
            show_womens_health: !!updatedUser.show_womens_health
        });
    } catch (error) {
        console.error('更新资料失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   PUT /api/auth/me/password
 * @desc    修改当前用户的密码
 */
router.put('/me/password', authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: '新密码至少需要 6 个字符。' });
    }

    try {
        const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        const user = rows[0];

        if (user.password_hash) {
            if (!oldPassword) {
                return res.status(400).json({ message: '请输入旧密码以进行验证。' });
            }
            const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ message: '旧密码错误。' });
            }
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

        res.json({ message: '密码更新成功！' });
    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   PUT /api/auth/me/settings
 */
router.put('/me/settings', authenticateToken, async (req, res) => {
    const { show_womens_health } = req.body;
    const userId = req.user.userId;

    if (typeof show_womens_health !== 'boolean') {
        return res.status(400).json({ message: '无效的设置值。' });
    }

    try {
        await pool.query('UPDATE users SET show_womens_health = ? WHERE id = ?', [show_womens_health, userId]);
        res.json({ message: '设置更新成功！' });
    } catch (error) {
        console.error('更新用户设置失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

// --- linux.do OAuth ---

router.get('/linuxdo', (req, res) => {
    const authUrl = `${config.LINUX_DO_AUTHORIZE_URL}?client_id=${config.LINUX_DO_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(config.LINUX_DO_REDIRECT_URI)}&scope=read`;
    res.redirect(authUrl);
});

router.get('/linuxdo/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/#/login?error=no_code`);

    try {
        const tokenResponse = await axios.post(config.LINUX_DO_TOKEN_URL, {
            grant_type: 'authorization_code',
            client_id: config.LINUX_DO_CLIENT_ID,
            client_secret: config.LINUX_DO_CLIENT_SECRET,
            code: code,
            redirect_uri: config.LINUX_DO_REDIRECT_URI
        });

        const accessToken = tokenResponse.data.access_token;
        const userResponse = await axios.get(config.LINUX_DO_USER_INFO_URL, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const linuxdoUser = userResponse.data;
        const { id: linuxdoId, username, email } = linuxdoUser;

        let [users] = await pool.query('SELECT * FROM users WHERE linuxdo_id = ?', [String(linuxdoId)]);
        let user = users[0];

        if (!user) {
            if (email) {
                const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
                if (existing.length > 0) {
                    await pool.query('UPDATE users SET linuxdo_id = ? WHERE id = ?', [String(linuxdoId), existing[0].id]);
                    user = existing[0];
                }
            }
            if (!user) {
                const [result] = await pool.query(
                    'INSERT INTO users (username, email, linuxdo_id) VALUES (?, ?, ?)',
                    [username || `linuxdo_${linuxdoId}`, email, String(linuxdoId)]
                );
                const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
                user = newUser[0];
            }
        }

        const token = generateToken(user.id);
        res.redirect(`${process.env.FRONTEND_URL}/callback.html?token=${token}`);
    } catch (error) {
        console.error('Linux.do OAuth Error:', error.message);
        res.redirect(`${process.env.FRONTEND_URL}/#/login?error=auth_failed`);
    }
});

// --- Google OAuth ---

router.get('/google', (req, res) => {
    // Basic Google OAuth URL - in production use a library like passport-google-oauth20 or manually build with scopes
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(config.GOOGLE_REDIRECT_URI)}&response_type=code&scope=email%20profile`;
    res.redirect(authUrl);
});

router.get('/google/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/#/login?error=no_code`);

    try {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: config.GOOGLE_CLIENT_ID,
            client_secret: config.GOOGLE_CLIENT_SECRET,
            redirect_uri: config.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
        });

        const { access_token } = tokenResponse.data;
        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const googleUser = userResponse.data;
        const { id: googleId, email, name } = googleUser;

        let [users] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
        let user = users[0];

        if (!user) {
            const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, existing[0].id]);
                user = existing[0];
            } else {
                const [result] = await pool.query(
                    'INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)',
                    [name || `google_${googleId}`, email, googleId]
                );
                const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
                user = newUser[0];
            }
        }

        const token = generateToken(user.id);
        res.redirect(`${process.env.FRONTEND_URL}/callback.html?token=${token}`);
    } catch (error) {
        console.error('Google OAuth Error:', error.message);
        res.redirect(`${process.env.FRONTEND_URL}/#/login?error=auth_failed`);
    }
});

// --- GitHub OAuth ---

router.get('/github', (req, res) => {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${config.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(config.GITHUB_REDIRECT_URI)}&scope=user:email`;
    res.redirect(authUrl);
});

router.get('/github/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/#/login?error=no_code`);

    try {
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: config.GITHUB_CLIENT_ID,
            client_secret: config.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: config.GITHUB_REDIRECT_URI
        }, {
            headers: { Accept: 'application/json' }
        });

        const { access_token } = tokenResponse.data;
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const githubUser = userResponse.data;
        const { id: githubId, login: username, email } = githubUser;

        let [users] = await pool.query('SELECT * FROM users WHERE github_id = ?', [String(githubId)]);
        let user = users[0];

        if (!user) {
            // GitHub email might be private, fetch explicitly if needed
            let userEmail = email;
            if (!userEmail) {
                const emailsResponse = await axios.get('https://api.github.com/user/emails', {
                    headers: { Authorization: `Bearer ${access_token}` }
                });
                const primaryEmail = emailsResponse.data.find(e => e.primary && e.verified);
                if (primaryEmail) userEmail = primaryEmail.email;
            }

            if (userEmail) {
                const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [userEmail]);
                if (existing.length > 0) {
                    await pool.query('UPDATE users SET github_id = ? WHERE id = ?', [String(githubId), existing[0].id]);
                    user = existing[0];
                }
            }

            if (!user) {
                const [result] = await pool.query(
                    'INSERT INTO users (username, email, github_id) VALUES (?, ?, ?)',
                    [username || `github_${githubId}`, userEmail, String(githubId)]
                );
                const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
                user = newUser[0];
            }
        }

        const token = generateToken(user.id);
        res.redirect(`${process.env.FRONTEND_URL}/callback.html?token=${token}`);
    } catch (error) {
        console.error('GitHub OAuth Error:', error.message);
        res.redirect(`${process.env.FRONTEND_URL}/#/login?error=auth_failed`);
    }
});

module.exports = router;
