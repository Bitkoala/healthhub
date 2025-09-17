// /后端服务/routes/sex.js

const express = require('express');
const pool = require('../db');
const authenticateToken = require('../authMiddleware');
const router = express.Router();

// --- 性生活记录路由 ---

/**
 * @route   GET /api/sex
 * @desc    获取用户所有的性生活记录
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        const [logs] = await pool.query('SELECT id, log_date, protection_method FROM sex_logs WHERE user_id = ? ORDER BY log_date DESC', [userId]);
        res.json(logs.map(log => ({
            ...log,
            log_date: log.log_date.toISOString().split('T')[0]
        })));
    } catch (error) {
        console.error('获取性生活记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   POST /api/sex
 * @desc    记录一次新的性生活
 * @access  Private
 */
router.post('/', authenticateToken, async (req, res) => {
    const { log_date, protection_method } = req.body;
    const userId = req.user.userId;

    if (!log_date) {
        return res.status(400).json({ message: '日期是必填项。' });
    }

    try {
        // 使用 INSERT ... ON DUPLICATE KEY UPDATE ... 来实现 "upsert"
        // 这需要 (user_id, log_date) 上有一个 UNIQUE 索引
        const [result] = await pool.query(
            'INSERT INTO sex_logs (user_id, log_date, protection_method) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE protection_method = VALUES(protection_method)',
            [userId, log_date, protection_method || null]
        );
        
        if (result.affectedRows === 1) {
            // 1 row affected 表示插入了一条新记录
            res.status(201).json({ id: result.insertId, message: '记录成功！' });
        } else if (result.affectedRows === 2) {
            // 2 rows affected 表示更新了一条现有记录
            res.status(200).json({ message: '记录已更新。' });
        } else {
            // 0 rows affected 可能意味着值没有变化
            res.status(200).json({ message: '记录无变化。' });
        }
    } catch (error) {
        console.error('记录性生活失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   DELETE /api/sex/:date
 * @desc    删除某一天的性生活记录
 * @access  Private
 */
router.delete('/:date', authenticateToken, async (req, res) => {
    const { date } = req.params;
    const userId = req.user.userId;

    try {
        const [result] = await pool.query('DELETE FROM sex_logs WHERE user_id = ? AND log_date = ?', [userId, date]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '未找到相关记录。' });
        }

        res.status(200).json({ message: '记录删除成功！' });
    } catch (error) {
        console.error('删除性生活记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

module.exports = router;