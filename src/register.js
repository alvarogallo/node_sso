const express = require('express');
const router = express.Router();
const pool = require('./conexion');
const bcrypt = require('bcryptjs');

// Página de registro para invitados
router.get('/', (req, res) => {
  const { email } = req.query;
  
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registro de Usuario</title>
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
            .register-container {
                background: white;
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                width: 100%;
                max-width: 500px;
            }
            h1 {
                text-align: center;
                color: #333;
                margin-bottom: 2rem;
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
            input[type="email"], input[type="text"], input[type="password"] {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 1rem;
                box-sizing: border-box;
            }
            input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
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
            .success {
                background-color: #d4edda;
                color: #155724;
                padding: 0.75rem;
                border-radius: 5px;
                margin-bottom: 1rem;
                display: none;
            }
            .error {
                background-color: #f8d7da;
                color: #721c24;
                padding: 0.75rem;
                border-radius: 5px;
                margin-bottom: 1rem;
                display: none;
            }
            .info {
                background-color: #d1ecf1;
                color: #0c5460;
                padding: 0.75rem;
                border-radius: 5px;
                margin-bottom: 1rem;
            }
            .login-link {
                text-align: center;
                margin-top: 1rem;
            }
            .login-link a {
                color: #667eea;
                text-decoration: none;
            }
            .login-link a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="register-container">
            <h1>Registro de Usuario</h1>
            
            <div class="info">
                Complete el formulario para crear su cuenta. Solo usuarios invitados pueden registrarse.
            </div>
            
            <div id="success" class="success"></div>
            <div id="error" class="error"></div>
            
            <form id="registerForm">
                <div class="form-group">
                    <label for="email">Email *</label>
                    <input type="email" id="email" name="email" value="${email || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="nombre">Nombre *</label>
                    <input type="text" id="nombre" name="nombre" required>
                </div>
                
                <div class="form-group">
                    <label for="apellido">Apellido</label>
                    <input type="text" id="apellido" name="apellido">
                </div>
                
                <div class="form-group">
                    <label for="password">Contraseña *</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">Confirmar Contraseña *</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required>
                </div>
                
                <button type="submit">Registrarse</button>
            </form>
            
            <div class="login-link">
                ¿Ya tienes cuenta? <a href="/admin/login">Iniciar Sesión</a>
            </div>
        </div>

        <script>
            document.getElementById('registerForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const nombre = document.getElementById('nombre').value;
                const apellido = document.getElementById('apellido').value;
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                const successDiv = document.getElementById('success');
                const errorDiv = document.getElementById('error');
                
                // Ocultar mensajes previos
                successDiv.style.display = 'none';
                errorDiv.style.display = 'none';
                
                // Validaciones del lado del cliente
                if (password !== confirmPassword) {
                    errorDiv.textContent = 'Las contraseñas no coinciden';
                    errorDiv.style.display = 'block';
                    return;
                }
                
                if (password.length < 6) {
                    errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
                    errorDiv.style.display = 'block';
                    return;
                }
                
                try {
                    const response = await fetch('/register/create', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email, nombre, apellido, password })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        successDiv.textContent = 'Registro exitoso. Su cuenta ha sido creada.';
                        successDiv.style.display = 'block';
                        
                        // Limpiar formulario
                        document.getElementById('registerForm').reset();
                        
                        // Redirigir al login después de 2 segundos
                        setTimeout(() => {
                            window.location.href = '/admin/login';
                        }, 2000);
                    } else {
                        errorDiv.textContent = data.error || 'Error al registrar usuario';
                        errorDiv.style.display = 'block';
                    }
                } catch (error) {
                    errorDiv.textContent = 'Error de conexión';
                    errorDiv.style.display = 'block';
                }
            });
        </script>
    </body>
    </html>
  `);
});

// Crear usuario desde registro (solo invitados)
router.post('/create', async (req, res) => {
  try {
    const { email, nombre, apellido, password } = req.body;
    
    // Validaciones básicas
    if (!email || !nombre || !password) {
      return res.status(400).json({ error: 'Email, nombre y contraseña son requeridos' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    // Verificar que el email tenga una invitación
    const [invitation] = await pool.query('SELECT * FROM users_invitations WHERE email = ?', [email]);
    if (!invitation.length) {
      return res.status(403).json({ error: 'No tienes una invitación válida para registrarte' });
    }
    
    // Verificar que el email no esté ya registrado
    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }
    
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear usuario con datos de la invitación
    const fullName = apellido ? `${nombre} ${apellido}` : nombre;
    
    const [result] = await pool.query(
      'INSERT INTO users (email, name, password, role, validated_at) VALUES (?, ?, ?, ?, NOW())',
      [email, fullName, hashedPassword, 'USER']
    );
    
    // Eliminar invitación una vez usado
    await pool.query('DELETE FROM users_invitations WHERE email = ?', [email]);
    
    res.status(201).json({ 
      success: true, 
      message: 'Usuario registrado exitosamente',
      userId: result.insertId 
    });
    
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;