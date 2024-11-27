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

// module.exports = pool;





// Crear tabla login_attempts si no existe
const initDatabase = async () => {
  try {
    // await pool.query(`
    //   CREATE TABLE IF NOT EXISTS login_attempts (
    //     id INT AUTO_INCREMENT PRIMARY KEY,
    //     username VARCHAR(255),
    //     ip_address VARCHAR(45),
    //     domain VARCHAR(255),
    //     user_agent TEXT,
    //     status ENUM('success', 'failed'),
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   )
    // `);
    // // await pool.query(`
    // //     ALTER TABLE users 
    // //     ADD COLUMN IF NOT EXISTS validated_at DATETIME DEFAULT NULL
    // //   `);
    // // //console.log('✅ Tabla login_attempts verificada/creada');
    // // console.log('✅ Database structure updated');
    // try {
    //     const [columns] = await pool.query(checkColumn, [process.env.MYSQLDATABASE]);
        
    //     if (columns[0].count === 0) {
    //       await pool.query(`
    //         ALTER TABLE users 
    //         ADD COLUMN validated_at DATETIME DEFAULT NULL
    //       `);
    //     }
        
    //     console.log('✅ Database structure updated');    
    const [columns] = await pool.query(checkColumn, [process.env.MYSQLDATABASE]);
    
    if (columns[0].count === 0) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN validated_at DATETIME DEFAULT NULL
      `);
    }
    
    console.log('✅ Database structure updated');    
  } catch (error) {
    console.error('❌ Error al crear tabla:', error);
  }
};

initDatabase();

module.exports = pool;