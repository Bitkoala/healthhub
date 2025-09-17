/**
 * @fileoverview /后端服务/routes/medications.js
 *
 * 此文件包含所有与用药计划和服药记录相关的API路由。
 * 功能包括：
 * - CRUD 操作用药计划 (medications)
 * - 记录服药历史 (medication_logs)
 * - 查询特定药品的服药历史
 * - 删除单条服药历史
 * - 自动清理过期的服药记录
 *
 * 所有路由均受JWT认证保护。
 */
const express = require('express');
const pool = require('../db');
const authenticateToken = require('../authMiddleware');
const router = express.Router();

router.use(authenticateToken);

/**
 * @route   GET /api/medications/
 * @desc    获取用户的所有用药计划
 * @access  Private
 * @note    在获取列表前，会触发一个“即发即忘”的异步操作，清理7天前的旧服药记录。
 */
router.get('/', async (req, res) => {
    try {
        // 在获取列表前，自动清理7天前的服药历史记录（fire-and-forget）
        pool.query(
            'DELETE FROM medication_logs WHERE user_id = ? AND taken_at < NOW() - INTERVAL 7 DAY',
            [req.user.userId]
        ).catch(cleanupError => {
            // 即便清理失败，也不应影响主功能，仅记录错误
            console.error('Auto-cleanup of old medication logs failed:', cleanupError);
        });

        const [meds] = await pool.query('SELECT * FROM medications WHERE user_id = ? ORDER BY id DESC', [req.user.userId]);
        res.json(meds);
    } catch (error) {
        console.error('获取用药记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   POST /api/medications/
 * @desc    添加一个新的用药计划
 * @access  Private
 */
router.post('/', async (req, res) => {
    try {
        // 【修改】接收新的 medication_times 字段
        const { name, dosage, frequency, stock, medication_times } = req.body;
        if (!name) {
            return res.status(400).json({ message: '药品名称不能为空。' });
        }
        const [result] = await pool.query(
            'INSERT INTO medications (user_id, name, dosage, frequency, stock, medication_times) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.userId, name, dosage, frequency, stock, medication_times]
        );
        const insertId = result.insertId;
        const [newMed] = await pool.query('SELECT * FROM medications WHERE id = ?', [insertId]);
        res.status(201).json(newMed[0]);
    } catch (error) {
        console.error('添加用药记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   PUT /api/medications/:id
 * @desc    更新一个已存在的用药计划的详细信息
 * @access  Private
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, dosage, frequency, stock, medication_times } = req.body;
        await pool.query(
            'UPDATE medications SET name = ?, dosage = ?, frequency = ?, stock = ?, medication_times = ? WHERE id = ? AND user_id = ?',
            [name, dosage, frequency, stock, medication_times, id, req.user.userId]
        );
        res.json({ message: '更新成功' });
    } catch (error) {
        console.error('更新用药记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   DELETE /api/medications/:id
 * @desc    删除一个用药计划
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM medications WHERE id = ? AND user_id = ?', [id, req.user.userId]);
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除用药记录失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

/**
 * @route   POST /api/medications/:id/take
 * @desc    记录一次服药操作（事务：扣减库存并添加日志）
 * @access  Private
 * @body    {number} dosageAmount - 本次服用的剂量，用于扣减库存。
 */
router.post('/:id/take', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { dosageAmount } = req.body;

        await connection.beginTransaction();

        // 1. 扣减库存
        await connection.query(
            'UPDATE medications SET stock = stock - ? WHERE id = ? AND user_id = ? AND stock >= ?',
            [dosageAmount, id, req.user.userId, dosageAmount]
        );

        // 2. 插入服药记录
        await connection.query(
            'INSERT INTO medication_logs (user_id, medication_id) VALUES (?, ?)',
            [req.user.userId, id]
        );

        await connection.commit();
        res.status(201).json({ message: '服药记录成功' });
    } catch (error) {
        await connection.rollback();
        console.error('服药操作失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    } finally {
        connection.release();
    }
});

/**
 * @route   GET /api/medications/:id/logs
 * @desc    获取指定药品的服药历史记录
 * @access  Private
 */
router.get('/:id/logs', async (req, res) => {
    try {
        const { id } = req.params;
        const [logs] = await pool.query(
            'SELECT * FROM medication_logs WHERE medication_id = ? AND user_id = ? ORDER BY taken_at DESC',
            [id, req.user.userId]
        );
        res.json(logs);
    } catch (error) {
        console.error('获取服药历史失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});


/**
 * @route   DELETE /api/medications/logs/:logId
 * @desc    删除一条指定的服药历史记录
 * @access  Private
 */
router.delete('/logs/:logId', async (req, res) => {
    try {
        const { logId } = req.params;
        const userId = req.user.userId;
        console.log(`Attempting to delete medication log. Log ID: ${logId}, User ID: ${userId}`);

        const [result] = await pool.query(
            'DELETE FROM medication_logs WHERE id = ? AND user_id = ?',
            [logId, userId]
        );

        console.log('Delete query executed. Affected rows:', result.affectedRows);

        if (result.affectedRows === 0) {
            console.log('No rows deleted. Returning 404.');
            return res.status(404).json({ message: '记录未找到或无权限删除' });
        }

        console.log('Successfully deleted log.');
        res.status(204).send();
    } catch (error) {
        console.error('删除服药历史失败:', error);
        res.status(500).json({ message: '服务器内部错误。' });
    }
});

module.exports = router;
