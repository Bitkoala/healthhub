/**
 * @fileoverview /后端服务/routes/finance.js
 * 
 * 此文件包含所有与财务相关的API路由，包括：
 * - 账户管理 (增查)
 * - 交易记录管理 (增删查)
 * - 借贷管理 (增删查改)
 * - 还款管理 (增删查)
 * - 财务报表生成
 * 
 * 所有路由都受JWT中间件保护。
 */
const express = require('express');
const pool = require('../db');
const authenticateToken = require('../authMiddleware');
const router = express.Router();

// 应用认证中间件于此路由下的所有端点
router.use(authenticateToken);

// --- 账户管理 API ---

/**
 * @route   GET /api/finance/accounts
 * @desc    获取用户的所有财务账户及其当前余额
 * @access  Private
 */
router.get('/accounts', async (req, res) => {
    try {
        const [accounts] = await pool.query('SELECT * FROM accounts WHERE user_id = ?', [req.user.userId]);
        const [transactions] = await pool.query('SELECT account_id, transaction_type, SUM(amount) as total FROM transactions WHERE user_id = ? GROUP BY account_id, transaction_type', [req.user.userId]);
        
        const balanceMap = {};
        transactions.forEach(t => {
            if (!balanceMap[t.account_id]) balanceMap[t.account_id] = 0;
            if (t.transaction_type === 'income') {
                balanceMap[t.account_id] += parseFloat(t.total);
            } else {
                balanceMap[t.account_id] -= parseFloat(t.total);
            }
        });

        const accountsWithBalance = accounts.map(acc => ({
            ...acc,
            current_balance: parseFloat(acc.initial_balance) + (balanceMap[acc.id] || 0)
        }));
        
        res.json(accountsWithBalance);
    } catch (error) {
        console.error('获取账户失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   POST /api/finance/accounts
 * @desc    创建一个新的财务账户
 * @access  Private
 */
router.post('/accounts', async (req, res) => {
    try {
        const { account_name, initial_balance } = req.body;
        const [result] = await pool.query('INSERT INTO accounts (user_id, account_name, initial_balance) VALUES (?, ?, ?)', [req.user.userId, account_name, initial_balance]);
        const [[newAccount]] = await pool.query('SELECT * FROM accounts WHERE id = ?', [result.insertId]);
        // 返回新账户信息，并附加计算后的当前余额
        res.status(201).json({ ...newAccount, current_balance: parseFloat(newAccount.initial_balance) });
    } catch (error) {
        console.error('创建账户失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// --- 交易记录 API ---

/**
 * @route   GET /api/finance/transactions
 * @desc    获取或搜索交易记录
 * @access  Private
 */
router.get('/transactions', async (req, res) => {
    try {
        const { startDate, endDate, category, limit } = req.query;
        let query = 'SELECT t.*, a.account_name FROM transactions t JOIN accounts a ON t.account_id = a.id WHERE t.user_id = ?';
        const params = [req.user.userId];

        let isSearching = false;

        if (startDate && endDate) {
            query += ' AND t.transaction_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
            isSearching = true;
        }
        
        if (category) {
            query += ' AND t.category LIKE ?';
            params.push(`%${category}%`);
            isSearching = true;
        }

        query += ' ORDER BY t.transaction_date DESC, t.id DESC';

        // 如果 limit=all，则不加 LIMIT 子句
        if (!isSearching && limit !== 'all') {
            query += ' LIMIT 10';
        }

        const [transactions] = await pool.query(query, params);
        res.json(transactions);
    } catch (error) {
        console.error('获取交易记录失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   POST /api/finance/transactions
 * @desc    创建一条新的交易记录
 * @access  Private
 */
router.post('/transactions', async (req, res) => {
    try {
        const { account_id, transaction_type, amount, category, notes, transaction_date } = req.body;
        const [result] = await pool.query('INSERT INTO transactions (user_id, account_id, transaction_type, amount, category, notes, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)', [req.user.userId, account_id, transaction_type, amount, category, notes, transaction_date]);
        const [[newTransaction]] = await pool.query('SELECT * FROM transactions WHERE id = ?', [result.insertId]);
        res.status(201).json(newTransaction);
    } catch (error) {
        console.error('创建交易失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// --- 借还款管理 API ---

/**
 * @route   GET /api/finance/loans
 * @desc    获取所有借贷记录及其还款状态
 * @access  Private
 */
router.get('/loans', async (req, res) => {
    try {
        // 使用左连接和子查询来计算每笔借贷的已还款总额
        const query = `
            SELECT 
                l.*,
                COALESCE(lr.total_repaid, 0) as total_repaid,
                l.amount - COALESCE(lr.total_repaid, 0) as remaining_amount
            FROM 
                loans l
            LEFT JOIN 
                (SELECT loan_id, SUM(amount) as total_repaid FROM loan_repayments WHERE user_id = ? GROUP BY loan_id) lr 
            ON l.id = lr.loan_id
            WHERE l.user_id = ?
            ORDER BY l.status ASC, l.loan_date DESC
        `;
        const [loans] = await pool.query(query, [req.user.userId, req.user.userId]);
        res.json(loans);
    } catch (error) {
        console.error('获取借贷记录失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   POST /api/finance/loans
 * @desc    创建一条新的借贷记录，并自动生成关联的交易记录
 * @access  Private
 */
router.post('/loans', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { loan_type, person_name, amount, notes, loan_date, account_id } = req.body;
        const user_id = req.user.userId;

        if (!person_name || !amount || !account_id) {
            await connection.rollback();
            return res.status(400).json({ message: '对方姓名、金额和关联账户为必填项' });
        }

        // 1. 创建借贷记录
        const [result] = await connection.query(
            'INSERT INTO loans (user_id, loan_type, person_name, amount, notes, loan_date) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, loan_type, person_name, amount, notes, loan_date]
        );
        const loanId = result.insertId;

        // 2. 创建对应的交易记录
        const transaction_type = loan_type === 'lend' ? 'expense' : 'income';
        const category = '借贷相关';
        const transaction_notes = loan_type === 'lend' ? `借出给 ${person_name}` : `从 ${person_name} 借入`;

        await connection.query(
            'INSERT INTO transactions (user_id, account_id, transaction_type, amount, category, notes, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, account_id, transaction_type, amount, category, transaction_notes, loan_date]
        );

        await connection.commit();
        
        const [[newLoan]] = await pool.query('SELECT * FROM loans WHERE id = ?', [loanId]);
        res.status(201).json(newLoan);

    } catch (error) {
        await connection.rollback();
        console.error('创建借贷记录失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * @route   PUT /api/finance/loans/:id/status
 * @desc    手动更新借贷记录的状态 (例如，从'unpaid'到'paid')
 * @access  Private
 */
router.put('/loans/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const repayment_date = status === 'paid' ? new Date() : null;
        await pool.query('UPDATE loans SET status = ?, repayment_date = ? WHERE id = ? AND user_id = ?', [status, repayment_date, id, req.user.userId]);
        res.json({ message: '借贷状态已更新' });
    } catch (error) {
        console.error('更新借贷状态失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   POST /api/finance/loans/:id/repay
 * @desc    记录一笔部分或全额还款，并自动生成关联的交易记录
 * @access  Private
 */
router.post('/loans/:id/repay', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id: loan_id } = req.params;
        const { amount, account_id, repayment_date } = req.body;
        const user_id = req.user.userId;

        if (!amount || !account_id) {
            throw new Error('还款金额和账户为必填项');
        }

        const [[loan]] = await connection.query('SELECT * FROM loans WHERE id = ? AND user_id = ? FOR UPDATE', [loan_id, user_id]);
        if (!loan) throw new Error('借贷记录未找到');
        if (loan.status === 'paid') throw new Error('该借贷已还清，无法重复还款');

        // 1. 创建交易记录
        const transaction_type = loan.loan_type === 'lend' ? 'income' : 'expense';
        const notes = loan.loan_type === 'lend' ? `收到 ${loan.person_name} 的还款` : `向 ${loan.person_name} 还款`;
        const [transactionResult] = await connection.query(
            'INSERT INTO transactions (user_id, account_id, transaction_type, amount, category, notes, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, account_id, transaction_type, amount, '借贷还款', notes, repayment_date || new Date()]
        );
        const transaction_id = transactionResult.insertId;

        // 2. 创建还款记录，并关联交易ID
        await connection.query(
            'INSERT INTO loan_repayments (user_id, loan_id, account_id, amount, repayment_date, transaction_id) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, loan_id, account_id, amount, repayment_date || new Date(), transaction_id]
        );

        // 3. 检查是否已还清
        const [[repayment_sum]] = await connection.query('SELECT SUM(amount) as total_repaid FROM loan_repayments WHERE loan_id = ?', [loan_id]);
        if (parseFloat(repayment_sum.total_repaid) >= parseFloat(loan.amount)) {
            await connection.query('UPDATE loans SET status = ?, repayment_date = ? WHERE id = ?', ['paid', new Date(), loan_id]);
        }

        await connection.commit();
        res.json({ message: '还款成功' });

    } catch (error) {
        await connection.rollback();
        console.error(`还款操作失败: ${error.message}`);
        res.status(500).json({ message: `还款操作失败: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * @route   GET /api/finance/loans/:loanId/repayments
 * @desc    获取指定借贷记录的所有还款历史
 * @access  Private
 */
router.get('/loans/:loanId/repayments', async (req, res) => {
    try {
        const { loanId } = req.params;
        const query = `
            SELECT 
                lr.*,
                a.account_name
            FROM 
                loan_repayments lr
            JOIN 
                accounts a ON lr.account_id = a.id
            WHERE 
                lr.loan_id = ? AND lr.user_id = ?
            ORDER BY 
                lr.repayment_date DESC, lr.id DESC
        `;
        const [repayments] = await pool.query(query, [loanId, req.user.userId]);
        res.json(repayments);
    } catch (error) {
        console.error('获取还款历史失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   DELETE /api/finance/transactions/:id
 * @desc    删除一条交易记录
 * @access  Private
 * @note    注意：如果此交易关联到一笔还款，应使用删除还款的接口，以确保数据一致性。
 */
router.delete('/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, req.user.userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '交易记录未找到' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('删除交易失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

/**
 * @route   DELETE /api/finance/loans/:id
 * @desc    删除一条借贷记录及其所有关联的还款记录 (事务操作)
 * @access  Private
 * @note    这是一个危险操作，因为它会级联删除所有相关的还款数据。
 */
router.delete('/loans/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id: loan_id } = req.params;
        const user_id = req.user.userId;

        // 检查借贷记录是否存在
        const [[loan]] = await connection.query('SELECT * FROM loans WHERE id = ? AND user_id = ?', [loan_id, user_id]);
        if (!loan) {
            await connection.rollback();
            return res.status(404).json({ message: '借贷记录未找到' });
        }

        // 1. 删除所有还款记录
        await connection.query('DELETE FROM loan_repayments WHERE loan_id = ? AND user_id = ?', [loan_id, user_id]);
        
        // 2. 删除借贷记录本身
        await connection.query('DELETE FROM loans WHERE id = ? AND user_id = ?', [loan_id, user_id]);

        await connection.commit();
        res.status(204).send();

    } catch (error) {
        await connection.rollback();
        console.error('删除借贷记录失败:', error);
        res.status(500).json({ message: '服务器内部错误' });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * @route   DELETE /api/finance/repayments/:id
 * @desc    删除一笔还款记录及其关联的交易记录 (事务操作)
 * @access  Private
 */
router.delete('/repayments/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id: repayment_id } = req.params;
        const user_id = req.user.userId;

        // 1. 获取还款记录详情
        const [[repayment]] = await connection.query('SELECT * FROM loan_repayments WHERE id = ? AND user_id = ?', [repayment_id, user_id]);
        if (!repayment) {
            throw new Error('还款记录未找到');
        }
        const { loan_id, transaction_id } = repayment;

        // 2. 删除关联的交易记录
        if (transaction_id) {
            await connection.query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [transaction_id, user_id]);
        }

        // 3. 删除还款记录本身
        await connection.query('DELETE FROM loan_repayments WHERE id = ?', [repayment_id]);

        // 4. 重新计算总还款额并更新父借贷状态
        const [[loan]] = await connection.query('SELECT amount FROM loans WHERE id = ? FOR UPDATE', [loan_id]);
        const [[repayment_sum]] = await connection.query('SELECT SUM(amount) as total_repaid FROM loan_repayments WHERE loan_id = ?', [loan_id]);
        const total_repaid = repayment_sum.total_repaid || 0;

        if (parseFloat(total_repaid) < parseFloat(loan.amount)) {
            await connection.query('UPDATE loans SET status = ?, repayment_date = NULL WHERE id = ?', ['unpaid', loan_id]);
        }

        await connection.commit();
        res.json({ message: '还款记录已删除' });

    } catch (error) {
        await connection.rollback();
        console.error(`删除还款记录失败: ${error.message}`);
        res.status(500).json({ message: `删除还款记录失败: ${error.message}` });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
