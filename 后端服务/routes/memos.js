/**
 * @fileoverview /后端服务/routes/memos.js
 *
 * 此文件包含所有与备忘录（待办事项）相关的API路由。
 * 功能包括：
 * - CRUD 操作备忘录
 * - 标记备忘录为完成/未完成
 * - 搜索已完成的历史备忘录
 *
 * 所有路由均受JWT认证保护。
 */
const express = require('express');
const pool = require('../db');
const authenticateToken = require('../authMiddleware');
const router = express.Router();

router.use(authenticateToken);

/**
 * @route   GET /api/memos/
 * @desc    获取用户的所有备忘录
 * @access  Private
 * @note    结果排序逻辑：未完成的在前，按优先级（高->中->低）排序，然后按创建时间降序。
 */
router.get('/', async (req, res) => {
    try {
        const [memos] = await pool.query(
            `SELECT * FROM memos WHERE user_id = ? 
             ORDER BY 
               is_completed ASC, 
               FIELD(priority, 'high', 'medium', 'low'), 
               created_at DESC`,
            [req.user.userId]
        );
        res.json(memos);
    } catch (error) {
        console.error('获取备忘录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   POST /api/memos/
 * @desc    添加一个新的备忘录
 * @access  Private
 */
router.post('/', async (req, res) => {
    try {
        const { task_name, priority } = req.body;
        if (!task_name) {
            return res.status(400).json({ message: '任务内容不能为空。' });
        }
        const [result] = await pool.query(
            'INSERT INTO memos (user_id, task_name, priority) VALUES (?, ?, ?)',
            [req.user.userId, task_name, priority || 'medium']
        );
        const [[newMemo]] = await pool.query('SELECT * FROM memos WHERE id = ?', [result.insertId]);
        res.status(201).json(newMemo);
    } catch (error) {
        console.error('添加备忘录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   PUT /api/memos/:id/status
 * @desc    更新备忘录的完成状态
 * @access  Private
 * @note    当标记为完成时，记录完成时间；取消完成时，则清除完成时间。
 */
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_completed } = req.body;
        // 【修改】如果任务被标记为完成，则记录当前时间；否则设为NULL
        const completed_at = is_completed ? new Date() : null;
        await pool.query(
            'UPDATE memos SET is_completed = ?, completed_at = ? WHERE id = ? AND user_id = ?',
            [is_completed, completed_at, id, req.user.userId]
        );
        res.json({ message: '状态已更新' });
    } catch (error) {
        console.error('更新备忘录状态失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   DELETE /api/memos/:id
 * @desc    删除一个备忘录
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM memos WHERE id = ? AND user_id = ?', [id, req.user.userId]);
        res.status(204).send();
    } catch (error) {
        console.error('删除备忘录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   GET /api/memos/history/search
 * @desc    在已完成的备忘录中进行文本搜索
 * @access  Private
 * @query   {string} q - 搜索关键词
 */
router.get('/history/search', async (req, res) => {
    try {
        const { q } = req.query; // 获取查询参数 q=...
        if (!q) {
            return res.json([]); // 如果没有查询词，返回空数组
        }
        
        const searchQuery = `%${q}%`;
        
        // 查询已完成的任务
        const [completedMemos] = await pool.query(
            `SELECT * FROM memos 
             WHERE user_id = ? AND is_completed = TRUE AND task_name LIKE ? 
             ORDER BY completed_at DESC`,
            [req.user.userId, searchQuery]
        );

        res.json(completedMemos);

    } catch (error) {
        console.error('搜索历史记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

module.exports = router;
