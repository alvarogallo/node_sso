const express = require('express');
const cookieParser = require('cookie-parser');
const apiRoutes = require('./apis');
const adminRoutes = require('./admin');
//const registerRoutes = require('./register');
//const invitadosRoutes = require('./invitados');
//const usuariosRoutes = require('./usuarios');
const pool = require('./conexion');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());

app.get('/', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT COUNT(*) as total FROM users');
    res.json({ total_users: result[0].total });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/test', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ message: 'Conexión exitosa' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas API
app.use('/api', apiRoutes);

// Rutas web
app.use('/admin', adminRoutes);
//app.use('/register', registerRoutes);
//app.use('/invitados', invitadosRoutes);
//app.use('/usuarios', usuariosRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});