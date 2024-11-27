// const express = require('express');
// const router = express.Router();
// const pool = require('./conexion');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');

// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
    
//     const clientIP = req.ip;
//     const clientDomain = req.get('host');
//     const userAgent = req.get('user-agent');

//     const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
//     if (!users.length) {
//       await pool.query(
//         'INSERT INTO login_attempts (username, ip_address, domain, user_agent, status) VALUES (?, ?, ?, ?, ?)',
//         [email, clientIP, clientDomain, userAgent, 'failed']
//       );
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     const validPassword = await bcrypt.compare(password, users[0].password);
//     if (!validPassword) {
//       await pool.query(
//         'INSERT INTO login_attempts (username, ip_address, domain, user_agent, status) VALUES (?, ?, ?, ?, ?)',
//         [email, clientIP, clientDomain, userAgent, 'failed']
//       );
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     await pool.query(
//       'INSERT INTO login_attempts (username, ip_address, domain, user_agent, status) VALUES (?, ?, ?, ?, ?)',
//       [email, clientIP, clientDomain, userAgent, 'success']
//     );

//     const token = jwt.sign(
//       { userId: users[0].id },
//       process.env.JWT_SECRET,
//       { expiresIn: '24h' }
//     );

//     res.json({
//       token,
//       user: {
//         id: users[0].id,
//         email: users[0].email
//       }
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// module.exports = router;
router.post('/login', async (req, res) => {
    try {
      const { email } = req.body;
      
      const [users] = await pool.query('SELECT id, email, password FROM users WHERE email = ?', [email]);
      
      if (!users.length) {
        return res.status(401).json({ error: 'User not found' });
      }
  
      res.json({
        found: true,
        passwordHash: users[0].password,
        email: users[0].email
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });