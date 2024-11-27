require('dotenv').config();
const mysql = require('mysql2/promise');

// Log environment variables safely
console.log('Environment Variables:');
console.log('DB_HOST:', process.env.DB_HOST || 'Not set');
console.log('DB_PORT:', process.env.DB_PORT || 'Not set');
console.log('DB_USER:', process.env.DB_USER || 'Not set');
console.log('DB_NAME:', process.env.DB_NAME || 'Not set');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[Password is set]' : 'Not set');

const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME
    host: process.env.DB_HOST.split(':')[0], // Separamos el host del puerto
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
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