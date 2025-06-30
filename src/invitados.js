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

// Función para generar HTML de la tabla
function generarTablaInvitaciones(invitations) {
  if (invitations.length === 0) {
    return `
      <div class="empty-state">
        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📧</div>
        <h3>No hay invitaciones enviadas</h3>
        <p>Comienza agregando la primera invitación usando el formulario de arriba.</p>
        <small style="color: #999;">Tip: Una vez que agregues invitaciones, aparecerán aquí con opciones para eliminar</small>
      </div>
    `;
  }

  let tabla = `
    <div style="margin-bottom: 1rem; padding: 0.5rem; background: #e3f2fd; border-radius: 5px; color: #1976d2;">
      💡 <strong>Tip:</strong> Puedes seleccionar múltiples invitaciones usando los checkboxes y eliminarlas todas a la vez.
    </div>
    <div style="overflow-x: auto;">
      <table style="width: 100%; min-width: 800px;">
        <thead>
          <tr>
            <th style="width: 50px;">
              <input type="checkbox" id="selectAll" onchange="toggleSelectAll()" title="Seleccionar todos">
            </th>
            <th style="width: 60px;">ID</th>
            <th style="width: 200px;">Email</th>
            <th style="width: 150px;">Nombre Completo</th>
            <th style="width: 140px;">Fecha de Invitación</th>
            <th style="width: 100px;">Estado</th>
            <th style="width: 280px; text-align: center;">Acciones</th>
          </tr>
        </thead>
        <tbody id="invitationsTable">
  `;

  invitations.forEach(invitation => {
    const nombreCompleto = [invitation.nombre, invitation.apellido].filter(Boolean).join(' ') || 'Sin nombre';
    const fechaFormateada = new Date(invitation.created_at).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    tabla += `
      <tr style="border-bottom: 1px solid #dee2e6;">
        <td style="padding: 1rem 0.75rem; vertical-align: middle;">
          <input type="checkbox" class="invitation-checkbox" value="${invitation.id}" onchange="updateDeleteButton()">
        </td>
        <td style="padding: 1rem 0.75rem; vertical-align: middle;"><strong>${invitation.id}</strong></td>
        <td style="padding: 1rem 0.75rem; vertical-align: middle;"><code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">${invitation.email}</code></td>
        <td style="padding: 1rem 0.75rem; vertical-align: middle;">${nombreCompleto}</td>
        <td style="padding: 1rem 0.75rem; vertical-align: middle;">${fechaFormateada}</td>
        <td style="padding: 1rem 0.75rem; vertical-align: middle;">
          <span style="background: #fff3cd; color: #856404; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.8rem; font-weight: bold;">
            ⏳ Pendiente
          </span>
        </td>
        <td style="padding: 1rem 0.75rem; vertical-align: middle; text-align: center;">
          <div style="display: flex; gap: 0.75rem; justify-content: center; align-items: center;">
            <button onclick="enviarRecordatorio('${invitation.email}')" 
                    style="padding: 0.6rem 1rem; font-size: 0.85rem; border-radius: 6px; border: none; cursor: pointer; transition: all 0.3s; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; min-width: 110px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: linear-gradient(135deg, #17a2b8, #20c997); color: white;"
                    title="Enviar recordatorio por email"
                    onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 6px 12px rgba(23, 162, 184, 0.4)';"
                    onmouseout="this.style.transform='translateY(0px)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
              📧 Recordatorio
            </button>
            <button onclick="eliminarInvitacion(${invitation.id}, '${invitation.email}')" 
                    style="padding: 0.6rem 1rem; font-size: 0.85rem; border-radius: 6px; border: none; cursor: pointer; transition: all 0.3s; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; min-width: 110px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: linear-gradient(135deg, #dc3545, #e74c3c); color: white;"
                    title="Eliminar esta invitación"
                    onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 6px 12px rgba(220, 53, 69, 0.4)';"
                    onmouseout="this.style.transform='translateY(0px)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
              🗑️ ELIMINAR
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tabla += `
        </tbody>
      </table>
    </div>
    <div style="margin-top: 1rem; padding: 0.75rem; background: #f8f9fa; border-radius: 5px; font-size: 0.9rem; color: #6c757d;">
      📊 Total de invitaciones: <strong>${invitations.length}</strong>
    </div>
  `;

  return tabla;
}

// Página principal de invitados (protegida)
router.get('/', verificarAdmin, async (req, res) => {
  try {
    const [invitations] = await pool.query(`
      SELECT id, email, nombre, apellido, created_at 
      FROM users_invitations 
      ORDER BY created_at DESC
    `);

    const [users] = await pool.query(`
      SELECT COUNT(*) as total_users FROM users
    `);

    const [confirmedUsers] = await pool.query(`
      SELECT COUNT(*) as confirmed_users FROM users WHERE validated_at IS NOT NULL
    `);

    const confirmationRate = users[0].total_users > 0 ? 
      Math.round((confirmedUsers[0].confirmed_users / users[0].total_users) * 100) : 0;

    const tablaHTML = generarTablaInvitaciones(invitations);
    const deleteButtonHTML = invitations.length > 0 ? 
      '<button id="deleteSelectedBtn" onclick="eliminarSeleccionados()" class="btn-danger btn-sm" style="display: none;">🗑️ Eliminar Seleccionados</button>' : '';
      
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Gestión de Invitados</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #f5f5f5;
              }
              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 2rem;
                  text-align: center;
              }
              .nav {
                  background: #5a67d8;
                  padding: 0 2rem;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
              }
              .nav-links {
                  display: flex;
              }
              .nav a {
                  color: white;
                  text-decoration: none;
                  padding: 1rem;
                  display: inline-block;
                  border-bottom: 3px solid transparent;
                  transition: all 0.3s;
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
                  margin-bottom: 2rem;
              }
              .card-header {
                  background: #f8f9fa;
                  padding: 1.5rem;
                  border-bottom: 1px solid #dee2e6;
              }
              .card-header h2 {
                  margin: 0;
                  color: #333;
              }
              .card-body {
                  padding: 1.5rem;
              }
              .stats-grid {
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
                  border-left: 4px solid #667eea;
              }
              .stat-number {
                  font-size: 2.5rem;
                  font-weight: bold;
                  color: #667eea;
                  margin-bottom: 0.5rem;
              }
              .stat-label {
                  color: #6c757d;
                  font-size: 0.9rem;
              }
              .form-row {
                  display: grid;
                  grid-template-columns: 1fr 1fr 1fr auto;
                  gap: 1rem;
                  align-items: end;
                  margin-bottom: 1rem;
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
              input[type="email"], input[type="text"] {
                  width: 100%;
                  padding: 0.75rem;
                  border: 1px solid #ddd;
                  border-radius: 5px;
                  font-size: 1rem;
                  box-sizing: border-box;
                  transition: border-color 0.3s;
              }
              input:focus {
                  outline: none;
                  border-color: #667eea;
                  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
              }
              button {
                  padding: 0.75rem 1.5rem;
                  background: #28a745;
                  color: white;
                  border: none;
                  border-radius: 5px;
                  font-size: 1rem;
                  cursor: pointer;
                  transition: background 0.3s;
              }
              button:hover {
                  background: #218838;
              }
              .btn-danger {
                  background: #dc3545;
              }
              .btn-danger:hover {
                  background: #c82333;
              }
              table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 1rem;
              }
              th, td {
                  padding: 1rem 0.75rem;
                  text-align: left;
                  border-bottom: 1px solid #dee2e6;
                  vertical-align: middle;
              }
              th {
                  background-color: #f8f9fa;
                  font-weight: bold;
                  color: #495057;
              }
              tr:hover {
                  background-color: #f1f3f4;
                  transition: background-color 0.2s;
              }
              tbody tr {
                  border-left: 3px solid transparent;
                  transition: all 0.2s;
              }
              tbody tr:hover {
                  border-left-color: #667eea;
                  background-color: #f8f9ff;
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
              .actions {
                  display: flex;
                  gap: 0.75rem;
                  justify-content: center;
                  align-items: center;
                  padding: 0.5rem;
              }
              .btn-sm {
                  padding: 0.6rem 1rem;
                  font-size: 0.85rem;
                  border-radius: 6px;
                  border: none;
                  cursor: pointer;
                  transition: all 0.3s;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  min-width: 110px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .btn-info {
                  background: linear-gradient(135deg, #17a2b8, #20c997);
                  color: white;
                  border: 2px solid #17a2b8;
              }
              .btn-info:hover {
                  background: linear-gradient(135deg, #138496, #1ea080);
                  border-color: #138496;
                  transform: translateY(-3px);
                  box-shadow: 0 6px 12px rgba(23, 162, 184, 0.4);
              }
              .btn-danger {
                  background: linear-gradient(135deg, #dc3545, #e74c3c);
                  color: white;
                  border: 2px solid #dc3545;
              }
              .btn-danger:hover {
                  background: linear-gradient(135deg, #c82333, #d32f2f);
                  border-color: #c82333;
                  transform: translateY(-3px);
                  box-shadow: 0 6px 12px rgba(220, 53, 69, 0.4);
              }
              .btn-danger:active {
                  transform: translateY(-1px);
                  box-shadow: 0 3px 6px rgba(220, 53, 69, 0.4);
              }
              .empty-state {
                  text-align: center;
                  padding: 3rem;
                  color: #6c757d;
              }
              .empty-state i {
                  font-size: 3rem;
                  margin-bottom: 1rem;
                  opacity: 0.5;
              }
              .header-flex {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>🎉 Gestión de Invitados</h1>
              <p>Administra las invitaciones para tu evento</p>
          </div>
          
          <div class="nav">
              <div class="nav-links">
                  <a href="/usuarios">Usuarios</a>
                  <a href="/invitados" class="active">Invitados</a>
                  <a href="/admin">Dashboard</a>
              </div>
              <a href="/admin/logout" class="btn-danger">Cerrar Sesión</a>
          </div>
          
          <div class="container">
              <!-- Estadísticas -->
              <div class="stats-grid">
                  <div class="stat-card">
                      <div class="stat-number">${invitations.length}</div>
                      <div class="stat-label">Invitaciones Enviadas</div>
                  </div>
                  <div class="stat-card">
                      <div class="stat-number">${users[0].total_users}</div>
                      <div class="stat-label">Usuarios Registrados</div>
                  </div>
                  <div class="stat-card">
                      <div class="stat-number">${confirmedUsers[0].confirmed_users}</div>
                      <div class="stat-label">Confirmados</div>
                  </div>
                  <div class="stat-card">
                      <div class="stat-number">${confirmationRate}%</div>
                      <div class="stat-label">Tasa de Confirmación</div>
                  </div>
              </div>

              <!-- Formulario para agregar invitados -->
              <div class="card">
                  <div class="card-header">
                      <h2>➕ Agregar Nueva Invitación</h2>
                  </div>
                  <div class="card-body">
                      <div id="success" class="success"></div>
                      <div id="error" class="error"></div>
                      
                      <form id="invitationForm">
                          <div class="form-row">
                              <div class="form-group">
                                  <label for="email">Email *</label>
                                  <input type="email" id="email" name="email" required placeholder="invitado@ejemplo.com">
                              </div>
                              <div class="form-group">
                                  <label for="nombre">Nombre</label>
                                  <input type="text" id="nombre" name="nombre" placeholder="Nombre">
                              </div>
                              <div class="form-group">
                                  <label for="apellido">Apellido</label>
                                  <input type="text" id="apellido" name="apellido" placeholder="Apellido">
                              </div>
                              <div class="form-group">
                                  <button type="submit">Enviar Invitación</button>
                              </div>
                          </div>
                      </form>
                  </div>
              </div>

              <!-- Lista de invitaciones -->
              <div class="card">
                  <div class="card-header">
                      <div class="header-flex">
                          <h2>📋 Lista de Invitaciones</h2>
                          ${deleteButtonHTML}
                      </div>
                  </div>
                  <div class="card-body">
                      ${tablaHTML}
                  </div>
              </div>
          </div>

          <script>
              // Agregar invitación
              document.getElementById('invitationForm').addEventListener('submit', async (e) => {
                  e.preventDefault();
                  
                  const email = document.getElementById('email').value;
                  const nombre = document.getElementById('nombre').value;
                  const apellido = document.getElementById('apellido').value;
                  const successDiv = document.getElementById('success');
                  const errorDiv = document.getElementById('error');
                  
                  successDiv.style.display = 'none';
                  errorDiv.style.display = 'none';
                  
                  try {
                      const response = await fetch('/invitados/agregar', {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ email, nombre, apellido })
                      });
                      
                      const data = await response.json();
                      
                      if (response.ok) {
                          successDiv.textContent = 'Invitación enviada exitosamente';
                          successDiv.style.display = 'block';
                          
                          document.getElementById('invitationForm').reset();
                          
                          setTimeout(() => {
                              window.location.reload();
                          }, 1500);
                      } else {
                          errorDiv.textContent = data.error || 'Error al enviar invitación';
                          errorDiv.style.display = 'block';
                      }
                  } catch (error) {
                      errorDiv.textContent = 'Error de conexión';
                      errorDiv.style.display = 'block';
                  }
              });

              // Enviar recordatorio
              async function enviarRecordatorio(email) {
                  if (confirm('¿Enviar recordatorio a ' + email + '?')) {
                      try {
                          const response = await fetch('/invitados/recordatorio', {
                              method: 'POST',
                              headers: {
                                  'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ email })
                          });
                          
                          if (response.ok) {
                              alert('Recordatorio enviado exitosamente');
                          } else {
                              alert('Error al enviar recordatorio');
                          }
                      } catch (error) {
                          alert('Error de conexión');
                      }
                  }
              }

              // Eliminar invitación individual
              async function eliminarInvitacion(id, email) {
                  if (confirm('¿Estás seguro de que quieres eliminar la invitación de "' + email + '"?\\n\\nEsta acción no se puede deshacer.')) {
                      try {
                          const response = await fetch('/invitados/eliminar/' + id, {
                              method: 'DELETE'
                          });
                          
                          const data = await response.json();
                          
                          if (response.ok) {
                              const successDiv = document.getElementById('success');
                              successDiv.textContent = 'Invitación de "' + email + '" eliminada exitosamente';
                              successDiv.style.display = 'block';
                              
                              setTimeout(() => {
                                  window.location.reload();
                              }, 1500);
                          } else {
                              alert('Error: ' + (data.error || 'No se pudo eliminar la invitación'));
                          }
                      } catch (error) {
                          console.error('Error:', error);
                          alert('Error de conexión al eliminar la invitación');
                      }
                  }
              }

              // Funciones para selección múltiple
              function toggleSelectAll() {
                  const selectAll = document.getElementById('selectAll');
                  const checkboxes = document.querySelectorAll('.invitation-checkbox');
                  
                  checkboxes.forEach(checkbox => {
                      checkbox.checked = selectAll.checked;
                  });
                  
                  updateDeleteButton();
              }

              function updateDeleteButton() {
                  const checkboxes = document.querySelectorAll('.invitation-checkbox:checked');
                  const deleteBtn = document.getElementById('deleteSelectedBtn');
                  const selectAll = document.getElementById('selectAll');
                  
                  if (deleteBtn) {
                      if (checkboxes.length > 0) {
                          deleteBtn.style.display = 'inline-block';
                          deleteBtn.textContent = '🗑️ Eliminar Seleccionados (' + checkboxes.length + ')';
                      } else {
                          deleteBtn.style.display = 'none';
                      }
                  }
                  
                  const allCheckboxes = document.querySelectorAll('.invitation-checkbox');
                  if (selectAll) {
                      selectAll.checked = allCheckboxes.length > 0 && checkboxes.length === allCheckboxes.length;
                  }
              }

              async function eliminarSeleccionados() {
                  const checkboxes = document.querySelectorAll('.invitation-checkbox:checked');
                  const ids = Array.from(checkboxes).map(cb => cb.value);
                  
                  if (ids.length === 0) {
                      alert('No hay invitaciones seleccionadas');
                      return;
                  }
                  
                  if (confirm('¿Estás seguro de que quieres eliminar ' + ids.length + ' invitación(es) seleccionada(s)?\\n\\nEsta acción no se puede deshacer.')) {
                      try {
                          const response = await fetch('/invitados/eliminar-multiples', {
                              method: 'DELETE',
                              headers: {
                                  'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ ids })
                          });
                          
                          const data = await response.json();
                          
                          if (response.ok) {
                              const successDiv = document.getElementById('success');
                              successDiv.textContent = ids.length + ' invitación(es) eliminada(s) exitosamente';
                              successDiv.style.display = 'block';
                              
                              setTimeout(() => {
                                  window.location.reload();
                              }, 1500);
                          } else {
                              alert('Error: ' + (data.error || 'No se pudieron eliminar las invitaciones'));
                          }
                      } catch (error) {
                          console.error('Error:', error);
                          alert('Error de conexión al eliminar las invitaciones');
                      }
                  }
              }
          </script>
      </body>
      </html>
    `);

  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar invitados');
  }
});

// Agregar nueva invitación
router.post('/agregar', verificarAdmin, async (req, res) => {
  try {
    const { email, nombre, apellido } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'El email es requerido' });
    }

    const [existingInvitation] = await pool.query('SELECT * FROM users_invitations WHERE email = ?', [email]);
    if (existingInvitation.length > 0) {
      return res.status(409).json({ error: 'Este email ya tiene una invitación' });
    }

    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Este email ya está registrado como usuario' });
    }

    await pool.query(
      'INSERT INTO users_invitations (email, nombre, apellido) VALUES (?, ?, ?)',
      [email, nombre || null, apellido || null]
    );

    res.json({ success: true, message: 'Invitación enviada exitosamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Enviar recordatorio
router.post('/recordatorio', verificarAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    
    const [invitation] = await pool.query('SELECT * FROM users_invitations WHERE email = ?', [email]);
    if (!invitation.length) {
      return res.status(404).json({ error: 'Invitación no encontrada' });
    }

    console.log(`Enviando recordatorio a: ${email}`);
    
    res.json({ success: true, message: 'Recordatorio enviado' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Eliminar múltiples invitaciones
router.delete('/eliminar-multiples', verificarAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs de invitaciones requeridos' });
    }
    
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.query(`DELETE FROM users_invitations WHERE id IN (${placeholders})`, ids);
    
    res.json({ 
      success: true, 
      message: `${result.affectedRows} invitación(es) eliminada(s)`,
      deletedCount: result.affectedRows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Eliminar invitación individual
router.delete('/eliminar/:id', verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query('DELETE FROM users_invitations WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Invitación no encontrada' });
    }

    res.json({ success: true, message: 'Invitación eliminada' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener estadísticas de invitados (API)
router.get('/stats', verificarAdmin, async (req, res) => {
  try {
    const [invitations] = await pool.query('SELECT COUNT(*) as total FROM users_invitations');
    const [users] = await pool.query('SELECT COUNT(*) as total FROM users');
    const [confirmed] = await pool.query('SELECT COUNT(*) as total FROM users WHERE validated_at IS NOT NULL');
    
    res.json({
      invitations: invitations[0].total,
      users: users[0].total,
      confirmed: confirmed[0].total,
      confirmationRate: users[0].total > 0 ? Math.round((confirmed[0].total / users[0].total) * 100) : 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ruta de prueba para verificar la base de datos
router.get('/test-db', verificarAdmin, async (req, res) => {
  try {
    // Verificar si la tabla existe
    const [tables] = await pool.query("SHOW TABLES LIKE 'users_invitations'");
    
    if (tables.length === 0) {
      return res.json({
        error: 'La tabla users_invitations no existe',
        suggestion: 'Ejecuta este SQL: CREATE TABLE users_invitations (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL, nombre VARCHAR(255), apellido VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);'
      });
    }
    
    // Verificar estructura de la tabla
    const [columns] = await pool.query("DESCRIBE users_invitations");
    
    // Contar registros
    const [count] = await pool.query("SELECT COUNT(*) as total FROM users_invitations");
    
    res.json({
      success: true,
      tableExists: true,
      columns: columns.map(col => ({ name: col.Field, type: col.Type })),
      totalRecords: count[0].total
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor: ' + error.message });
  }
});

module.exports = router;