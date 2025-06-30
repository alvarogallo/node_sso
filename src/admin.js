const express = require('express');
const router = express.Router();
const pool = require('./conexion');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Middleware para verificar autenticación de admin
const verificarAdmin = (req, res, next) => {
  const token = req.cookies?.adminToken || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.redirect('/admin/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el token incluya role='ADMIN'
    if (decoded.role !== 'ADMIN') {
      res.clearCookie('adminToken');
      return res.redirect('/admin/login');
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie('adminToken');
    return res.redirect('/admin/login');
  }
};

// Ruta principal de admin - redirige según autenticación
router.get('/', (req, res) => {
  const token = req.cookies?.adminToken;
  
  if (!token) {
    return res.redirect('/admin/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Verificar que tenga role='ADMIN'
    if (decoded.role === 'ADMIN') {
      return res.redirect('/usuarios');
    } else {
      res.clearCookie('adminToken');
      return res.redirect('/admin/login');
    }
  } catch (error) {
    res.clearCookie('adminToken');
    return res.redirect('/admin/login');
  }
});

// Página de login
// Página de login
router.get('/login', async (req, res) => {
  // Verificar conexión a la base de datos
  let dbStatus = { connected: false, message: 'Error de conexión', color: '#dc3545' };
  
  try {
    const connection = await pool.getConnection();
    await connection.ping(); // Verificar que la conexión esté activa
    connection.release();
    
    dbStatus = { 
      connected: true, 
      message: 'Conexión DB OK ✅', 
      color: '#28a745' 
    };
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    dbStatus = { 
      connected: false, 
      message: `Error DB: ${error.message}`, 
      color: '#dc3545' 
    };
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin - Login</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .login-container {
                background: white;
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                width: 100%;
                max-width: 400px;
            }
            h1 {
                text-align: center;
                color: #333;
                margin-bottom: 2rem;
            }
            .db-status {
                background: #f8f9fa;
                padding: 0.75rem;
                border-radius: 5px;
                margin-bottom: 1.5rem;
                text-align: center;
                font-weight: bold;
                border-left: 4px solid ${dbStatus.color};
                color: ${dbStatus.color};
            }
            .form-group {
                margin-bottom: 1rem;
            }
            label {
                display: block;
                margin-bottom: 0.5rem;
                color: #555;
                font-weight: bold;
            }
            input[type="email"], input[type="password"] {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 1rem;
                box-sizing: border-box;
            }
            button {
                width: 100%;
                padding: 0.75rem;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 1rem;
                cursor: pointer;
                transition: background 0.3s;
            }
            button:hover {
                background: #5a67d8;
            }
            button:disabled {
                background: #6c757d;
                cursor: not-allowed;
            }
            .error {
                color: #e53e3e;
                margin-top: 0.5rem;
                text-align: center;
            }
            .db-details {
                background: #e3f2fd;
                padding: 0.5rem;
                border-radius: 3px;
                margin-top: 0.5rem;
                font-size: 0.8rem;
                color: #1976d2;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <h1>Administración</h1>
            
            <!-- Estado de la base de datos -->
            <div class="db-status">
                🔗 ${dbStatus.message}
                <div class="db-details">
                    Host: ${process.env.MYSQLHOST || 'No configurado'}<br>
                    Base: ${process.env.DB_NAME || 'No configurada'}<br>
                    Usuario: ${process.env.DB_USER || 'No configurado'}
                </div>
            </div>
            
            <form id="loginForm">
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" required ${!dbStatus.connected ? 'disabled' : ''}>
                </div>
                <div class="form-group">
                    <label for="password">Contraseña:</label>
                    <input type="password" id="password" name="password" required ${!dbStatus.connected ? 'disabled' : ''}>
                </div>
                <button type="submit" ${!dbStatus.connected ? 'disabled' : ''}>
                    ${dbStatus.connected ? 'Iniciar Sesión' : 'Base de Datos Desconectada'}
                </button>
                <div id="error" class="error"></div>
            </form>
            
            <div style="text-align: center; margin-top: 1rem;">
                ¿No tienes cuenta? <a href="/register" style="color: #667eea; text-decoration: none;">Registrar</a>
            </div>
        </div>

        <script>
            // Verificar conexión de DB cada 10 segundos
            setInterval(async () => {
                try {
                    const response = await fetch('/test');
                    const data = await response.json();
                    
                    if (response.ok) {
                        console.log('✅ DB Connection check passed:', data.message);
                    } else {
                        console.error('❌ DB Connection check failed');
                    }
                } catch (error) {
                    console.error('❌ DB Connection check error:', error);
                }
            }, 10000);

            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const errorDiv = document.getElementById('error');
                
                try {
                    const response = await fetch('/admin/auth', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email, password })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        window.location.href = '/usuarios';
                    } else {
                        errorDiv.textContent = data.error || 'Error al iniciar sesión';
                    }
                } catch (error) {
                    errorDiv.textContent = 'Error de conexión';
                }
            });
        </script>
    </body>
    </html>
  `);
});

// Autenticación de admin
router.post('/auth', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Verificar que el usuario existe, está validado Y tiene role='ADMIN'
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND validated_at IS NOT NULL AND role = ?', 
      [email, 'ADMIN']
    );
    
    if (!users.length) {
      return res.status(401).json({ error: 'Acceso denegado. No tienes permisos de administrador.' });
    }

    const validPassword = await bcrypt.compare(password, users[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { userId: users[0].id, email: users[0].email, role: users[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('adminToken', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      secure: process.env.NODE_ENV === 'production'
    });

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('adminToken');
  res.redirect('/admin/login');
});

module.exports = router;