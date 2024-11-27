const express = require('express');
const router = express.Router();
const pool = require('./conexion');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

router.get('/', async (req, res) => {
    try {
      const [result] = await pool.query('SELECT COUNT(*) as total FROM users');
      res.json({ total_users: result[0].total });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
});

// Middleware para verificar TOKEN_ACCESO
const verificarToken = (req, res, next) => {
    const tokenAcceso = req.headers['token-acceso'];
    if (tokenAcceso !== process.env.TOKEN_ACCESO) {
      return res.status(403).json({ error: 'Sitio no autorizado para servicio de LOGIN' });
    }
    next();
  };



//router.post('/login', async (req, res) => {
router.post('/login', verificarToken, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const clientIP = req.ip;
    const clientDomain = req.get('host');
    const userAgent = req.get('user-agent');

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!users.length) {
      await pool.query(
        'INSERT INTO login_attempts (username, ip_address, domain, user_agent, status) VALUES (?, ?, ?, ?, ?)',
        [email, clientIP, clientDomain, userAgent, 'failed']
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, users[0].password);
    if (!validPassword) {
      await pool.query(
        'INSERT INTO login_attempts (username, ip_address, domain, user_agent, status) VALUES (?, ?, ?, ?, ?)',
        [email, clientIP, clientDomain, userAgent, 'failed']
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!users[0].validated_at) {
        await pool.query(
            'INSERT INTO login_attempts (username, ip_address, domain, user_agent, status) VALUES (?, ?, ?, ?, ?)',
            [email, clientIP, clientDomain, userAgent, 'failed']
        );        
        return res.status(403).json({ error: 'Account not validated' });
      }

    await pool.query(
      'INSERT INTO login_attempts (username, ip_address, domain, user_agent, status) VALUES (?, ?, ?, ?, ?)',
      [email, clientIP, clientDomain, userAgent, 'success']
    );

    const token = jwt.sign(
      { userId: users[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: users[0].id,
        email: users[0].email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/register', verificarToken, async (req, res) => {
    try {
      const { email, password, name, phone } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [result] = await pool.query(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        [email, hashedPassword, name]
      );
  
      if (phone) {
        await pool.query(
          'INSERT INTO users_info (user_id, metodo, valor) VALUES (?, ?, ?)',
          [result.insertId, 'phone', phone]
        );
      }
  
      res.status(201).json({ success: true, userId: result.insertId });
  
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  router.post('/verify-token', verificarToken, async (req, res) => {
    try {
      const { token } = req.body;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const [user] = await pool.query('SELECT id, email, validated_at FROM users WHERE id = ?', [decoded.userId]);
      
      if (!user.length || !user[0].validated_at) {
        return res.status(401).json({ valid: false });
      }
  
      res.json({ valid: true, user: user[0] });
    } catch (error) {
      res.status(401).json({ valid: false });
    }
  });

  router.post('/validar', verificarToken, async (req, res) => {
    try {
      const { email } = req.body;
      
      const [result] = await pool.query(
        'UPDATE users SET validated_at = CURRENT_TIMESTAMP WHERE email = ?',
        [email]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
module.exports = router;