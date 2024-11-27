require('dotenv').config();
const mysql = require('mysql2/promise');

// Log environment variables safely
console.log('Environment Variables:');
console.log('DB_HOST:', process.env.DB_HOST || 'Not set');
console.log('DB_USER:', process.env.DB_USER || 'Not set');
console.log('DB_NAME:', process.env.DB_NAME || 'Not set');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[Password is set]' : 'Not set');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();