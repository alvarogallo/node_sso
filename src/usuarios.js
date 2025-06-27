const express = require('express');
const router = express.Router();
const pool = require('./conexion');
const jwt = require('jsonwebtoken');

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

// Página de usuarios (protegida)
router.get('/', verificarAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT id, email, name, role, validated_at, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Admin - Usuarios</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #f5f5f5;
              }
              .header {
                  background: #667eea;
                  color: white;
                  padding: 1rem 2rem;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
              }
              .nav {
                  background: #5a67d8;
                  padding: 0 2rem;
              }
              .nav a {
                  color: white;
                  text-decoration: none;
                  padding: 1rem;
                  display: inline-block;
                  border-bottom: 3px solid transparent;
              }
              .nav a:hover, .nav a.active {
                  border-bottom-color: white;
                  background: rgba(255,255,255,0.1);
              }
              .container {
                  max-width: 1200px;
                  margin: 2rem auto;
                  padding: 0 1rem;
              }
              .card {
                  background: white;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  overflow: hidden;
              }
              .card-header {
                  background: #f8f9fa;
                  padding: 1rem 1.5rem;
                  border-bottom: 1px solid #dee2e6;
              }
              .card-body {
                  padding: 1.5rem;
              }
              table {
                  width: 100%;
                  border-collapse: collapse;
              }
              th, td {
                  padding: 0.75rem;
                  text-align: left;
                  border-bottom: 1px solid #dee2e6;
              }
              th {
                  background-color: #f8f9fa;
                  font-weight: bold;
                  color: #495057;
              }
              .status {
                  padding: 0.25rem 0.5rem;
                  border-radius: 3px;
                  font-size: 0.8rem;
                  font-weight: bold;
              }
              .status.validated {
                  background-color: #d4edda;
                  color: #155724;
              }
              .status.pending {
                  background-color: #fff3cd;
                  color: #856404;
              }
              .logout-btn {
                  background: #dc3545;
                  color: white;
                  border: none;
                  padding: 0.5rem 1rem;
                  border-radius: 5px;
                  cursor: pointer;
                  text-decoration: none;
                  display: inline-block;
              }
              .logout-btn:hover {
                  background: #c82333;
              }
              .stats {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                  gap: 1rem;
                  margin-bottom: 2rem;
              }
              .stat-card {
                  background: white;
                  padding: 1.5rem;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  text-align: center;
              }
              .stat-number {
                  font-size: 2rem;
                  font-weight: bold;
                  color: #667eea;
              }
              .stat-label {
                  color: #6c757d;
                  margin-top: 0.5rem;
              }
              .btn-danger {
                  background: #dc3545;
                  color: white;
                  border: none;
                  padding: 0.4rem 0.8rem;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 0.8rem;
              }
              .btn-danger:hover {
                  background: #c82333;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Panel de Administración</h1>
              <a href="/admin/logout" class="logout-btn">Cerrar Sesión</a>
          </div>
          
          <div class="nav">
              <a href="/usuarios" class="active">Usuarios</a>
              <a href="/invitados">Invitados</a>
              <a href="/admin">Dashboard</a>
          </div>
          
          <div class="container">
              <div class="stats">
                  <div class="stat-card">
                      <div class="stat-number">${users.length}</div>
                      <div class="stat-label">Total Usuarios</div>
                  </div>
                  <div class="stat-card">
                      <div class="stat-number">${users.filter(u => u.validated_at).length}</div>
                      <div class="stat-label">Usuarios Validados</div>
                  </div>
                  <div class="stat-card">
                      <div class="stat-number">${users.filter(u => !u.validated_at).length}</div>
                      <div class="stat-label">Pendientes</div>
                  </div>
                  <div class="stat-card">
                      <div class="stat-number">${users.filter(u => u.role === 'ADMIN').length}</div>
                      <div class="stat-label">Administradores</div>
                  </div>
              </div>

              <div class="card">
                  <div class="card-header">
                      <h2>Lista de Usuarios</h2>
                  </div>
                  <div class="card-body">
                      <table>
                          <thead>
                              <tr>
                                  <th>ID</th>
                                  <th>Email</th>
                                  <th>Nombre</th>
                                  <th>Role</th>
                                  <th>Estado</th>
                                  <th>Fecha</th>
                                  <th>Acciones</th>
                              </tr>
                          </thead>
                          <tbody>
                              ${users.map(user => `
                                  <tr>
                                      <td>${user.id}</td>
                                      <td>${user.email}</td>
                                      <td>${user.name || 'N/A'}</td>
                                      <td>
                                          <span class="status ${user.role === 'ADMIN' ? 'validated' : 'pending'}">
                                              ${user.role || 'USER'}
                                          </span>
                                      </td>
                                      <td>
                                          <span class="status ${user.validated_at ? 'validated' : 'pending'}">
                                              ${user.validated_at ? 'Validado' : 'Pendiente'}
                                          </span>
                                      </td>
                                      <td>${new Date(user.created_at).toLocaleDateString('es-ES')}</td>
                                      <td>
                                          ${user.role !== 'ADMIN' ? 
                                            `<button onclick="eliminarUsuario(${user.id}, '${user.email}')" class="btn-danger">
                                               🗑️ Eliminar
                                             </button>` : 
                                            '<span style="color: #6c757d; font-size: 0.8rem;">Protegido</span>'
                                          }
                                      </td>
                                  </tr>
                              `).join('')}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>

          <script>
              async function eliminarUsuario(id, email) {
                  if (confirm('¿Estás seguro de que quieres eliminar el usuario "' + email + '"?\\n\\nEsta acción no se puede deshacer.')) {
                      try {
                          const response = await fetch('/usuarios/eliminar/' + id, {
                              method: 'DELETE'
                          });
                          
                          const data = await response.json();
                          
                          if (response.ok) {
                              alert('Usuario eliminado exitosamente');
                              window.location.reload();
                          } else {
                              alert('Error: ' + (data.error || 'No se pudo eliminar el usuario'));
                          }
                      } catch (error) {
                          console.error('Error:', error);
                          alert('Error de conexión al eliminar el usuario');
                      }
                  }
              }
          </script>
      </body>
      </html>
    `);

  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar usuarios');
  }
});

// Eliminar usuario (solo si no es ADMIN)
router.delete('/eliminar/:id', verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el usuario existe y no es ADMIN
    const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    
    if (!user.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    if (user[0].role === 'ADMIN') {
      return res.status(403).json({ error: 'No se puede eliminar un usuario administrador' });
    }
    
    const [result] = await pool.query('DELETE FROM users WHERE id = ? AND role != ?', [id, 'ADMIN']);
    
    if (result.affectedRows === 0) {
      return res.status(403).json({ error: 'No se puede eliminar este usuario' });
    }

    res.json({ success: true, message: 'Usuario eliminado exitosamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener estadísticas de usuarios (API)
router.get('/stats', verificarAdmin, async (req, res) => {
  try {
    const [totalUsers] = await pool.query('SELECT COUNT(*) as total FROM users');
    const [validatedUsers] = await pool.query('SELECT COUNT(*) as total FROM users WHERE validated_at IS NOT NULL');
    const [adminUsers] = await pool.query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['ADMIN']);
    const [pendingUsers] = await pool.query('SELECT COUNT(*) as total FROM users WHERE validated_at IS NULL');
    
    res.json({
      total: totalUsers[0].total,
      validated: validatedUsers[0].total,
      admins: adminUsers[0].total,
      pending: pendingUsers[0].total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;