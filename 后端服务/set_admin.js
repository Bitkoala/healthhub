const pool = require('./db');

async function promoteAdmin(username) {
    try {
        console.log(`正在尝试将用户 [${username}] 设为管理员...`);

        // 1. 检查用户是否存在
        const [users] = await pool.query('SELECT id, username FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            console.error(`错误：找不到用户名为 "${username}" 的用户。请检查拼写。`);
            process.exit(1);
        }

        // 2. 执行更新
        const [result] = await pool.query('UPDATE users SET is_admin = 1 WHERE username = ?', [username]);

        if (result.affectedRows > 0) {
            console.log('--------------------------------------------------');
            console.log(`成功！用户 [${username}] 已晋升为管理员。`);
            console.log('--------------------------------------------------');
            console.log('现在您可以登录并看到“盾牌”图标进入管理面板了。');
        } else {
            console.log('该用户已经是管理员。');
        }

        process.exit(0);
    } catch (error) {
        console.error('发生错误：', error.message);
        process.exit(1);
    }
}

// 从命令行参数获取用户名
const targetUser = process.argv[2] || 'user_76e90386';
promoteAdmin(targetUser);
