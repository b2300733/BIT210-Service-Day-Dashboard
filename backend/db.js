const mysql = require('mysql2/promise');

const required = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  throw new Error(`Missing database environment variables: ${missing.join(', ')}`);
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  timezone: 'Z',
  dateStrings: true,
});

const query = (sql, params = []) => pool.execute(sql, params);

module.exports = {
  pool,
  query,
};
