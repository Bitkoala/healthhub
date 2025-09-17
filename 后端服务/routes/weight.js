const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../authMiddleware');

// 获取最近的体重记录和身高
router.get('/', authenticateToken, async (req, res) => {
  try {
    // 默认获取最近15条记录，并按日期时间降序排列
    const [weightLogs] = await db.query('SELECT * FROM weight_logs WHERE user_id = ? ORDER BY log_datetime DESC LIMIT 15', [req.user.userId]);
    const [userRows] = await db.query('SELECT height_cm FROM users WHERE id = ?', [req.user.userId]);
    const height_cm = userRows.length > 0 ? userRows[0].height_cm : null;

    // 为了图表正确显示，我们返回给前端时还是升序
    res.json({
      weights: weightLogs.reverse(),
      height: height_cm
    });
  } catch (error) {
    console.error('获取体重数据失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取指定日期范围内的历史记录
router.get('/history', authenticateToken, async (req, res) => {
    const { start_datetime, end_datetime } = req.query;
    if (!start_datetime || !end_datetime) {
        return res.status(400).json({ message: '必须提供开始和结束日期时间' });
    }
    try {
        const [historyLogs] = await db.query(
            'SELECT * FROM weight_logs WHERE user_id = ? AND log_datetime BETWEEN ? AND ? ORDER BY log_datetime ASC',
            [req.user.userId, start_datetime, end_datetime]
        );
        res.json(historyLogs);
    } catch (error) {
        console.error('获取历史体重数据失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 添加一条新的体重记录
router.post('/', authenticateToken, async (req, res) => {
  const { weight, log_datetime } = req.body;
  if (!weight || !log_datetime) {
    return res.status(400).json({ message: '体重和日期时间不能为空' });
  }

  try {
    const sql = 'INSERT INTO weight_logs (user_id, log_datetime, weight) VALUES (?, ?, ?)';
    await db.query(sql, [req.user.userId, log_datetime, weight]);
    res.status(201).json({ message: '体重记录已保存' });
  } catch (error) {
    console.error('保存体重记录失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 更新用户身高
router.put('/height', authenticateToken, async (req, res) => {
  const { height } = req.body;
  if (!height || isNaN(parseFloat(height)) || parseFloat(height) <= 0) {
    return res.status(400).json({ message: '无效的身高值' });
  }

  try {
    await db.query('UPDATE users SET height_cm = ? WHERE id = ?', [parseFloat(height), req.user.userId]);
    res.json({ message: '身高已更新' });
  } catch (error) {
    console.error('更新身高失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 删除一条体重记录
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: '记录ID不能为空' });
    }

    try {
        const [result] = await db.query('DELETE FROM weight_logs WHERE user_id = ? AND id = ?', [req.user.userId, id]);
        if (result.affectedRows > 0) {
            res.json({ message: '体重记录已删除' });
        } else {
            res.status(404).json({ message: '未找到指定的记录' });
        }
    } catch (error) {
        console.error('删除体重记录失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});


module.exports = router;