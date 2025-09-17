/**
 * @file /后端服务/routes/admin.js
 * @description 管理员功能路由模块。
 *
 * 提供管理员专属的 API 接口，用于用户管理和系统维护。
 * 所有路由都受 `authenticateToken` 和 `adminMiddleware` 中间件保护，
 * 确保只有已登录的管理员才能访问。
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const authenticateToken = require('../authMiddleware');
const adminMiddleware = require('../adminMiddleware');

// 应用于此路由下所有接口的中间件：先验证登录状态，再验证管理员权限。
router.use(authenticateToken, adminMiddleware);

/**
 * @route   GET /api/admin/users
 * @desc    获取所有用户的列表。
 * @access  Private (Admin only)
 */
router.get('/users', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, email, created_at, last_login_at, is_admin FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   POST /api/admin/reset-password
 * @desc    为指定用户重置密码。
 * @access  Private (Admin only)
 * @body    {number} userId - 需要重置密码的用户ID。
 */
router.post('/reset-password', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: '必须提供用户ID' });
    }

    try {
        const newPassword = Math.random().toString(36).slice(-8); // 生成8位随机密码
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);

        res.json({ message: `用户 ${userId} 的密码已重置。`, newPassword: newPassword });
    } catch (error) {
        console.error('重置密码失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   DELETE /api/admin/delete-user/:userId
 * @desc    删除指定用户及其所有关联数据。
 * @access  Private (Admin only)
 * @param   {number} userId - 需要删除的用户ID。
 */
router.delete('/delete-user/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ message: '必须提供用户ID' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 使用数据库事务来确保所有关联数据被原子性地删除。
        // 如果任何一步删除失败，整个事务将回滚。
        await connection.query('DELETE FROM weight_logs WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM sex_logs WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM menstrual_records WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM exercise_logs WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM daily_logs WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM daily_items WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM stool_logs WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM memos WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM medication_logs WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM medications WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM loan_repayments WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM loans WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM transactions WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM accounts WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM users WHERE id = ?', [userId]);
        
        await connection.commit();
        res.json({ message: `用户 ${userId} 及其所有数据已成功删除。` });
    } catch (error) {
        await connection.rollback();
        console.error(`删除用户 ${userId} 失败:`, error);
        res.status(500).json({ message: '删除用户失败，服务器内部错误。' });
    } finally {
        connection.release();
    }
});

/**
 * @route   POST /api/admin/cleanup-inactive-users
 * @desc    清理指定天数内未登录的非管理员用户。
 * @access  Private (Admin only)
 * @body    {number} days - 未登录天数的阈值。
 */
router.post('/cleanup-inactive-users', async (req, res) => {
    const { days } = req.body;
    if (!days || isNaN(parseInt(days))) {
        return res.status(400).json({ message: '必须提供有效的天数。' });
    }

    const connection = await pool.getConnection();
    try {
        // 找出所有符合条件的非管理员用户ID
        const [inactiveUsers] = await connection.query(
            'SELECT id FROM users WHERE is_admin = 0 AND (last_login_at IS NULL OR last_login_at < NOW() - INTERVAL ? DAY)',
            [parseInt(days)]
        );

        if (inactiveUsers.length === 0) {
            return res.json({ message: '没有找到需要清理的非活跃用户。' });
        }

        const userIds = inactiveUsers.map(u => u.id);
        
        await connection.beginTransaction();
        // 使用 IN 子句批量删除
        await connection.query('DELETE FROM weight_logs WHERE user_id IN (?)', [userIds]);
        await connection.query('DELETE FROM sex_logs WHERE user_id IN (?)', [userIds]);
        await connection.query('DELETE FROM menstrual_records WHERE user_id IN (?)', [userIds]);
        await connection.query('DELETE FROM exercise_logs WHERE user_id IN (?)', [userIds]);
        await connection.query('DELETE FROM daily_logs WHERE user_id IN (?)', [userIds]);
        await connection.query('DELETE FROM daily_items WHERE user_id IN (?)', [userIds]);
        await connection.query('DELETE FROM stool_logs WHERE user_id IN (?)', [userIds]);
        await connection.query('DELETE FROM memos WHERE user_id IN (?)', [userIds]);
        await connection.query('DELETE FROM medication_logs WHERE user_id IN (?)', [userIds]);
        await connection.query('DELETE FROM medications WHERE user_id IN (?)', [userIds]);
        await connection.query('DELETE FROM loan_repayments WHERE user_id IN (?)', [userIds]);
        await connection.query('DELETE FROM loans WHERE user_id IN (?)', [userIds]);
        await connection.query('DELETE FROM transactions WHERE user_id IN (?)', [userIds]);
        await connection.query('DELETE FROM accounts WHERE user_id IN (?)', [userIds]);
        await connection.query('DELETE FROM users WHERE id IN (?)', [userIds]);

        await connection.commit();
        res.json({ message: `成功清理了 ${userIds.length} 个非活跃用户。`, cleanedUserIds: userIds });

    } catch (error) {
        await connection.rollback();
        console.error('清理非活跃用户失败:', error);
        res.status(500).json({ message: '清理失败，服务器内部错误。' });
    } finally {
        connection.release();
    }
});


module.exports = router;