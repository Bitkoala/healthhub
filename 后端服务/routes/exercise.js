// /后端服务/routes/exercise.js

const express = require('express');
const pool = require('../db');
const authenticateToken = require('../authMiddleware');
const router = express.Router();

// 应用认证中间件于此路由下的所有端点
router.use(authenticateToken);

/**
 * @route   POST /api/exercise
 * @desc    添加一条新的运动记录
 * @access  Private
 */
router.post('/', async (req, res) => {
    try {
        const { log_date, exercise_name, duration_minutes, sets, reps, notes } = req.body;
        if (!log_date || !exercise_name) {
            return res.status(400).json({ message: '日期和运动名称是必填项' });
        }
        const [result] = await pool.query(
            'INSERT INTO exercise_logs (user_id, log_date, exercise_name, duration_minutes, sets, reps, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.userId, log_date, exercise_name, duration_minutes, sets, reps, notes]
        );
        // 返回新创建的完整记录对象
        res.status(201).json({
            id: result.insertId,
            ...req.body,
            user_id: req.user.userId
        });
    } catch (error) {
        console.error('添加运动记录失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   GET /api/exercise/search
 * @desc    在指定日期范围内搜索运动记录
 * @access  Private
 */
router.get('/search', async (req, res) => {
    try {
        const { exerciseName, startDate, endDate } = req.query;
        const userId = req.user.userId;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: '开始日期和结束日期是必填项' });
        }

        // 为了确保查询范围的准确性（包含 endDate 当天），将结束日期的范围扩展到第二天的零点
        const nextDayDate = new Date(endDate);
        nextDayDate.setDate(nextDayDate.getDate() + 1);
        const nextDayDateStr = nextDayDate.toISOString().split('T')[0];

        let query = 'SELECT log_date, duration_minutes, sets, reps, exercise_name FROM exercise_logs WHERE user_id = ? AND log_date >= ? AND log_date < ?';
        const params = [userId, startDate, nextDayDateStr];

        if (exerciseName && exerciseName.trim() !== '') {
            query += ' AND exercise_name LIKE ?';
            params.push(`%${exerciseName}%`);
        }

        query += ' ORDER BY log_date ASC';

        const [results] = await pool.query(query, params);
        res.json(results);
    } catch (error) {
        console.error("搜索运动记录失败:", error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   GET /api/exercise/:date
 * @desc    获取指定日期的所有运动记录
 * @access  Private
 */
router.get('/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const [logs] = await pool.query(
            'SELECT * FROM exercise_logs WHERE user_id = ? AND log_date = ? ORDER BY created_at ASC',
            [req.user.userId, date]
        );
        res.json(logs);
    } catch (error) {
        console.error('获取运动记录失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   GET /api/exercise/summary/:year/:month
 * @desc    获取指定月份中有运动记录的日期列表（用于日历标记）
 * @access  Private
 */
router.get('/summary/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;
        const numYear = parseInt(year, 10);
        const numMonth = parseInt(month, 10); // 前端传入的月份是 1-indexed

        // 计算该月的第一天和最后一天
        const startDate = new Date(Date.UTC(numYear, numMonth - 1, 1));
        const endDate = new Date(Date.UTC(numYear, numMonth, 0));

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const [dates] = await pool.query(
            'SELECT DISTINCT DATE_FORMAT(log_date, "%Y-%m-%d") as log_date FROM exercise_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?',
            [req.user.userId, startDateStr, endDateStr]
        );
        res.json(dates.map(d => d.log_date));
    } catch (error) {
        console.error('获取运动总结失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   DELETE /api/exercise/:id
 * @desc    删除一条运动记录
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query(
            'DELETE FROM exercise_logs WHERE id = ? AND user_id = ?',
            [id, req.user.userId]
        );
        if (result.affectedRows > 0) {
            res.json({ message: '运动记录删除成功' });
        } else {
            res.status(404).json({ message: '未找到记录或无权删除' });
        }
    } catch (error) {
        console.error('删除运动记录失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

module.exports = router;