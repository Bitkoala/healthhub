/**
 * @fileoverview /后端服务/routes/stool.js
 *
 * 此文件包含所有与排便记录相关的API路由。
 * 功能包括：
 * - CRUD 操作排便记录
 * - 获取所有存在记录的日期，用于在日历上进行标记
 *
 * 所有路由均受JWT认证保护。
 */
const express = require('express');
const pool = require('../db');
const authenticateToken = require('../authMiddleware');
const router = express.Router();

router.use(authenticateToken);

/**
 * @route   GET /api/stool/
 * @desc    获取用户的所有排便记录
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = 'SELECT * FROM stool_logs WHERE user_id = ?';
        const params = [req.user.userId];

        if (startDate && endDate) {
            query += ' AND log_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY log_date DESC, id DESC';

        const [logs] = await pool.query(query, params);
        res.json(logs);
    } catch (error) {
        console.error('获取排便记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   GET /api/stool/dates
 * @desc    获取所有包含排便记录的日期数组
 * @access  Private
 * @returns {string[]} ["YYYY-MM-DD", "YYYY-MM-DD", ...]
 */
router.get('/dates', async (req, res) => {
    try {
        const [results] = await pool.query(
            'SELECT DISTINCT log_date FROM stool_logs WHERE user_id = ?', 
            [req.user.userId]
        );
        // 提取并格式化日期字符串 "YYYY-MM-DD"
        const dates = results.map(r => new Date(r.log_date).toISOString().split('T')[0]);
        res.json(dates);
    } catch (error) {
        console.error('获取排便记录日期失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   GET /api/stool/summary
 * @desc    获取指定日期范围内的每日排便次数统计
 * @access  Private
 * @query   {string} startDate - YYYY-MM-DD
 * @query   {string} endDate - YYYY-MM-DD
 */
router.get('/summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: '必须提供开始和结束日期。' });
        }

        const [results] = await pool.query(
            `SELECT 
                log_date, 
                COUNT(id) as count 
             FROM stool_logs 
             WHERE user_id = ? AND log_date BETWEEN ? AND ? 
             GROUP BY log_date 
             ORDER BY log_date ASC`,
            [req.user.userId, startDate, endDate]
        );
        
        // 将结果转换为 { 'YYYY-MM-DD': count } 的格式
        const summary = results.reduce((acc, row) => {
            const date = new Date(row.log_date).toISOString().split('T')[0];
            acc[date] = row.count;
            return acc;
        }, {});

        res.json(summary);
    } catch (error) {
        console.error('获取排便统计失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   POST /api/stool/
 * @desc    添加一条新的排便记录
 * @access  Private
 */
router.post('/', async (req, res) => {
    try {
        const { log_date, stool_type, notes } = req.body;
        if (!log_date) {
            return res.status(400).json({ message: '记录日期不能为空。' });
        }
        const [result] = await pool.query(
            'INSERT INTO stool_logs (user_id, log_date, stool_type, notes) VALUES (?, ?, ?, ?)',
            [req.user.userId, log_date, stool_type, notes]
        );
        // 返回新创建的完整记录
        const [[newLog]] = await pool.query('SELECT * FROM stool_logs WHERE id = ?', [result.insertId]);
        res.status(201).json(newLog);
    } catch (error) {
        console.error('添加排便记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   PUT /api/stool/:id
 * @desc    更新一条已存在的排便记录
 * @access  Private
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { log_date, stool_type, notes } = req.body;
        if (!log_date) {
            return res.status(400).json({ message: '记录日期不能为空。' });
        }
        await pool.query(
            'UPDATE stool_logs SET log_date = ?, stool_type = ?, notes = ? WHERE id = ? AND user_id = ?',
            [log_date, stool_type, notes, id, req.user.userId]
        );
        const [[updatedLog]] = await pool.query('SELECT * FROM stool_logs WHERE id = ?', [id]);
        res.json(updatedLog);
    } catch (error) {
        console.error('更新排便记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});


/**
 * @route   DELETE /api/stool/:id
 * @desc    删除一条排便记录
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM stool_logs WHERE id = ? AND user_id = ?', [id, req.user.userId]);
        res.status(204).send();
    } catch (error) {
        console.error('删除排便记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});


module.exports = router;
