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
//const initDatabase = async () => {
    //try {
    //   await pool.query(`
    //     CREATE TABLE IF NOT EXISTS login_attempts (
    //       id INT AUTO_INCREMENT PRIMARY KEY,
    //       username VARCHAR(255),
    //       ip_address VARCHAR(45),
    //       domain VARCHAR(255),
    //       user_agent TEXT,
    //       status ENUM('success', 'failed'),
    //       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //     )
    //   `);
  
    //   const checkColumn = `
    //     SELECT COUNT(*) as count 
    //     FROM INFORMATION_SCHEMA.COLUMNS 
    //     WHERE TABLE_NAME = 'users' 
    //     AND COLUMN_NAME = 'validated_at'
    //     AND TABLE_SCHEMA = ?
    //   `;
      
    //   const [columns] = await pool.query(checkColumn, [process.env.MYSQLDATABASE]);
      
    //   if (columns[0].count === 0) {
    //     await pool.query(`
    //       ALTER TABLE users 
    //       ADD COLUMN validated_at DATETIME DEFAULT NULL
    //     `);
    //   }

    //   await pool.query(`
    //     CREATE TABLE IF NOT EXISTS users_info (
    //       id INT AUTO_INCREMENT PRIMARY KEY,
    //       user_id INT NOT NULL,
    //       metodo VARCHAR(16) DEFAULT NULL,
    //       valor VARCHAR(32) DEFAULT NULL,
    //       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    //     )
    //   `);

    // const checkNameColumn = `
    //     SELECT COUNT(*) as count 
    //     FROM INFORMATION_SCHEMA.COLUMNS 
    //     WHERE TABLE_NAME = 'users' 
    //     AND COLUMN_NAME = 'name'
    //     AND TABLE_SCHEMA = ?
    //     `;

    //     const [nameColumns] = await pool.query(checkNameColumn, [process.env.MYSQLDATABASE]);

    //     if (nameColumns[0].count === 0) {
    //     await pool.query(`
    //         ALTER TABLE users 
    //         ADD COLUMN name VARCHAR(64) DEFAULT NULL 
    //         AFTER email
    //     `);
    // }
            
    //   console.log('✅ Database structure updated');
    // } catch (error) {
    //   console.error('❌ Database error:', error);
    // }
  //};

//initDatabase();

module.exports = pool;