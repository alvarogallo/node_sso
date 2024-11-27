require('dotenv').config();
const mysql = require('mysql2/promise');

const [host] = process.env.MYSQLHOST.split(':');

const pool = mysql.createPool({
  host,
  port: 36100,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;