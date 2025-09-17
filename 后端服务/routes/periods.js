// /后端服务/routes/periods.js

const express = require('express');
const pool = require('../db');
const authenticateToken = require('../authMiddleware');
const router = express.Router();

// --- 生理周期记录路由 ---

// IMPORTANT: Specific routes must come before dynamic routes like /:id

/**
 * @route   GET /api/periods/predict
 * @desc    获取经期和排卵期预测
 * @access  Private
 */
router.get('/predict', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        // Fetch both start and end dates
        const [records] = await pool.query('SELECT start_date, end_date FROM menstrual_records WHERE user_id = ? ORDER BY start_date ASC', [userId]);

        if (records.length < 2) {
            return res.json({
                averageCycleLength: 0,
                averagePeriodLength: 0,
                nextPeriodStartDate: null,
                fertileWindow: null,
                ovulationDate: null,
                message: '历史记录不足，暂时无法预测。请至少记录两个完整的周期。'
            });
        }

        // 1. Calculate all cycle lengths
        const cycleLengths = [];
        for (let i = 0; i < records.length - 1; i++) {
            const startDate = new Date(records[i].start_date);
            const nextStartDate = new Date(records[i + 1].start_date);
            const diffTime = Math.abs(nextStartDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            cycleLengths.push(diffDays);
        }
        
        // 2. Calculate all period lengths
        const periodLengths = records
            .filter(r => r.end_date)
            .map(r => {
                const startDate = new Date(r.start_date);
                const endDate = new Date(r.end_date);
                const diffTime = Math.abs(endDate - startDate);
                // Add 1 because the duration includes both start and end dates
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            });

        if (cycleLengths.length === 0) {
             return res.json({
                averageCycleLength: 0,
                averagePeriodLength: 0,
                nextPeriodStartDate: null,
                fertileWindow: null,
                ovulationDate: null,
                message: '历史记录不足，暂时无法预测。请至少记录两个完整的周期。'
            });
        }

        // 3. Calculate averages
        const averageCycleLength = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
        const averagePeriodLength = periodLengths.length > 0 ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length) : 5; // Default to 5 days

        // 4. Predict
        const lastRecord = records[records.length - 1];
        const lastStartDate = new Date(lastRecord.start_date);
        
        const nextPeriodStartDate = new Date(lastStartDate);
        nextPeriodStartDate.setDate(nextPeriodStartDate.getDate() + averageCycleLength);

        const ovulationDate = new Date(nextPeriodStartDate);
        ovulationDate.setDate(ovulationDate.getDate() - 14);

        const fertileWindowStart = new Date(ovulationDate);
        fertileWindowStart.setDate(fertileWindowStart.getDate() - 5);
        
        // The fertile window ends a day after ovulation
        const fertileWindowEnd = new Date(ovulationDate);
        fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 1);

        res.json({
            averageCycleLength,
            averagePeriodLength,
            nextPeriodStartDate: nextPeriodStartDate.toISOString().split('T')[0],
            ovulationDate: ovulationDate.toISOString().split('T')[0],
            fertileWindow: {
                start: fertileWindowStart.toISOString().split('T')[0],
                end: fertileWindowEnd.toISOString().split('T')[0]
            }
        });

    } catch (error) {
        console.error('经期预测失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});


/**
 * @route   POST /api/periods
 * @desc    记录一个新的经期开始
 * @access  Private
 */
router.post('/', authenticateToken, async (req, res) => {
    const { start_date, pain_level, flow_volume, notes, color, state } = req.body;
    const userId = req.user.userId;

    if (!start_date) {
        return res.status(400).json({ message: '经期开始日期是必填项。' });
    }

    try {
        // When creating a new record, end_date is always NULL.
        const [result] = await pool.query(
            'INSERT INTO menstrual_records (user_id, start_date, end_date, pain_level, flow_volume, notes, color, state) VALUES (?, ?, NULL, ?, ?, ?, ?, ?)',
            [userId, start_date, pain_level || '无', flow_volume || '正常', notes || null, color || null, state || null]
        );
        
        const newRecord = {
            id: result.insertId,
            user_id: userId,
            start_date,
            end_date: null,
            pain_level: pain_level || '无',
            flow_volume: flow_volume || '正常',
            notes: notes || null,
            color: color || null,
            state: state || null
        };
        res.status(201).json(newRecord);
    } catch (error) {
        console.error('记录经期失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   GET /api/periods
 * @desc    获取当前用户所有的经期记录
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        const [records] = await pool.query('SELECT * FROM menstrual_records WHERE user_id = ? ORDER BY start_date DESC', [userId]);
        res.json(records);
    } catch (error) {
        console.error('获取经期记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});


/**
 * @route   PUT /api/periods/:id
 * @desc    更新一条经期记录 (例如，添加结束日期)
 * @access  Private
 */
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { end_date, pain_level, flow_volume, notes, color, state } = req.body;
    const userId = req.user.userId;

    try {
        const updates = {};
        // Allow setting end_date to null
        if (end_date !== undefined) updates.end_date = end_date;
        if (pain_level) updates.pain_level = pain_level;
        if (flow_volume) updates.flow_volume = flow_volume;
        if (notes !== undefined) updates.notes = notes;
        if (color !== undefined) updates.color = color;
        if (state !== undefined) updates.state = state;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: '没有提供任何需要更新的信息。' });
        }

        const [result] = await pool.query('UPDATE menstrual_records SET ? WHERE id = ? AND user_id = ?', [updates, id, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '未找到相关记录，或您无权修改。' });
        }

        res.json({ message: '记录更新成功！' });
    } catch (error) {
        console.error('更新经期记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   DELETE /api/periods/:id
 * @desc    删除一条经期记录
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const [result] = await pool.query('DELETE FROM menstrual_records WHERE id = ? AND user_id = ?', [id, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '未找到相关记录，或您无权删除。' });
        }

        res.json({ message: '记录删除成功！' });
    } catch (error) {
        console.error('删除经期记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

module.exports = router;