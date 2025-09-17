/**
 * @file /后端服务/db.js
 * @description 数据库连接模块。
 *
 * 该文件负责：
 * 1. 从环境变量中读取数据库配置。
 * 2. 创建一个 MySQL2 连接池，用于高效管理数据库连接。
 * 3. 导出连接池实例，供其他模块使用。
 * 4. 强制为每个新连接设置 UTF-8 字符集，确保数据编码正确。
 */

const mysql = require('mysql2/promise');

/**
 * 数据库连接池配置。
 * 所有配置项均从环境变量中读取，以保证敏感信息的安全。
 * @see https://github.com/mysqljs/mysql#pool-options
 */
const dbConfig = {
  host: process.env.DB_HOST, // 数据库主机名
  port: process.env.DB_PORT, // 数据库端口
  user: process.env.DB_USER, // 数据库用户名
  password: process.env.DB_PASSWORD, // 数据库密码
  database: process.env.DB_DATABASE, // 数据库名称
  charset: 'utf8mb4', // 设置连接字符集以支持 Emoji 和特殊字符
  waitForConnections: true, // 当连接池耗尽时，新的请求将排队等待可用连接
  connectionLimit: 10, // 连接池中的最大连接数
  queueLimit: 0 // 连接请求队列的最大长度（0表示不限制）
};

/**
 * MySQL 连接池实例。
 * 使用连接池可以复用数据库连接，避免了为每个请求都创建和销毁连接的开销，
 * 从而提高应用性能和可伸缩性。
 */
const pool = mysql.createPool(dbConfig);

/**
 * 监听 'connection' 事件，为每个新建立的连接设置会话的字符集。
 * 这是一个额外的保障措施，确保所有与数据库的通信都使用 'utf8mb4' 编码，
 * 防止因环境配置问题导致的乱码。
 */
pool.on('connection', function (connection) {
  connection.query("SET NAMES 'utf8mb4'", (err) => {
    if (err) {
      console.error('Failed to set names to utf8mb4 on new connection', err);
    }
  });
});

module.exports = pool;