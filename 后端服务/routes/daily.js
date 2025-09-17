// /后端服务/routes/daily.js

const express = require('express');
const pool = require('../db');
const authenticateToken = require('../authMiddleware');
const router = express.Router();

// 应用认证中间件于此路由下的所有端点
router.use(authenticateToken);

// --- 自定义项目管理 API ---

/**
 * @route   GET /api/daily-logs/items
 * @desc    获取用户的所有自定义打卡项目（每日任务和一次性任务）
 * @access  Private
 */
router.get('/items', async (req, res) => {
    try {
        const [items] = await pool.query('SELECT * FROM daily_items WHERE user_id = ? ORDER BY created_at ASC', [req.user.userId]);
        res.json(items);
    } catch (error) {
        console.error('获取自定义项目失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   POST /api/daily-logs/items
 * @desc    添加一个新的自定义打卡项目
 * @access  Private
 */
router.post('/items', async (req, res) => {
    try {
        const { item_name, item_type } = req.body;
        if (!item_name || !item_type) {
            return res.status(400).json({ message: '项目名称和类型不能为空' });
        }
        const [result] = await pool.query(
            'INSERT INTO daily_items (user_id, item_name, item_type) VALUES (?, ?, ?)',
            [req.user.userId, item_name, item_type]
        );
        // 返回新创建的完整项目对象，以便前端可以立即使用，无需重新请求
        res.status(201).json({ 
            id: result.insertId, 
            user_id: req.user.userId,
            item_name, 
            item_type, 
            status: null, // 一次性任务的初始状态为 null
            created_at: new Date().toISOString() 
        });
    } catch (error) {
        console.error('添加自定义项目失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   DELETE /api/daily-logs/items/:id
 * @desc    删除一个自定义项目及其所有相关的打卡记录
 * @access  Private
 */
router.delete('/items/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        
        // 首先获取项目名称，用于删除关联的日志
        const [itemToDelete] = await connection.query('SELECT item_name FROM daily_items WHERE id = ? AND user_id = ?', [id, req.user.userId]);

        if (itemToDelete.length > 0) {
            const itemName = itemToDelete[0].item_name;
            // 1. 删除所有相关的日志记录
            await connection.query('DELETE FROM daily_logs WHERE user_id = ? AND item_name = ?', [req.user.userId, itemName]);
            // 2. 删除项目本身
            await connection.query('DELETE FROM daily_items WHERE id = ? AND user_id = ?', [id, req.user.userId]);
            await connection.commit();
            res.json({ message: '项目已删除' });
        } else {
             await connection.rollback();
             res.status(404).json({ message: '未找到要删除的项目' });
        }
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('删除自定义项目失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * @route   PUT /api/daily-logs/items/:id/complete
 * @desc    将一个一次性任务标记为已完成
 * @access  Private
 */
router.put('/items/:id/complete', async (req, res) => {
    const { id } = req.params;
    if (isNaN(Number(id))) {
        return res.status(400).json({ message: '无效的任务ID' });
    }

    try {
        const [result] = await pool.query(
            "UPDATE daily_items SET status = 'completed' WHERE id = ? AND user_id = ? AND item_type = 'one-time'",
            [id, req.user.userId]
        );

        if (result.affectedRows > 0) {
            res.json({ message: '任务已完成' });
        } else {
            res.status(404).json({ message: '未找到或无法更新该任务（可能不是一次性任务）' });
        }
    } catch (error) {
        console.error(`完成一次性任务失败 (ID: ${id}):`, error);
        res.status(500).json({ message: '服务器内部错误，请稍后重试' });
    }
});


// --- 每日记录管理 API ---

/**
 * @route   GET /api/daily-logs/logs/:date
 * @desc    获取指定日期的所有打卡记录
 * @access  Private
 */
router.get('/logs/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const [logs] = await pool.query('SELECT * FROM daily_logs WHERE user_id = ? AND log_date = ?', [req.user.userId, date]);
        res.json(logs);
    } catch (error) {
        console.error('获取每日记录失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   POST /api/daily-logs/logs
 * @desc    添加或更新一条每日打卡记录 (使用 ON DUPLICATE KEY UPDATE)
 * @access  Private
 */
router.post('/logs', async (req, res) => {
    try {
        const { log_date, item_name, status, notes } = req.body;
        // 如果记录已存在（基于 user_id, log_date, item_name 的唯一索引），则更新 status 和 notes
        const sql = `
            INSERT INTO daily_logs (user_id, log_date, item_name, status, notes)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes)
        `;
        await pool.query(sql, [req.user.userId, log_date, item_name, status, notes]);
        res.status(201).json({ message: '记录已保存' });
    } catch (error) {
        console.error('保存每日记录失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   GET /api/daily-logs/history/search
 * @desc    根据关键词搜索历史打卡记录
 * @access  Private
 */
router.get('/history/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            return res.status(400).json({ message: '搜索内容不能为空' });
        }
        const searchQuery = `%${q.trim()}%`;
        const [logs] = await pool.query(
            "SELECT * FROM daily_logs WHERE user_id = ? AND (item_name LIKE ? OR notes LIKE ?) ORDER BY log_date DESC LIMIT 50",
            [req.user.userId, searchQuery, searchQuery]
        );
        res.json(logs);
    } catch (error) {
        console.error('搜索历史记录失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});


module.exports = router;