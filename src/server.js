const express = require('express');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./apis');
const adminRoutes = require('./admin');
const registerRoutes = require('./register');
const invitadosRoutes = require('./invitados');
const usuariosRoutes = require('./usuarios');
const pool = require('./conexion');

const app = express();
const port = 3000;

// Rate limiting para login - Prevenir ataques de fuerza bruta
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos por IP en 15 minutos
  message: {
    error: 'Demasiados intentos de login desde esta IP. Inténtalo de nuevo en 15 minutos.'
  },
  standardHeaders: true, // Incluir info en headers `RateLimit-*`
  legacyHeaders: false, // Desabilitar headers `X-RateLimit-*`
  skipSuccessfulRequests: true, // No contar requests exitosos
});

// Rate limiting general para API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por IP en 15 minutos
  message: {
    error: 'Demasiadas peticiones desde esta IP. Inténtalo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(cookieParser());

// Aplicar rate limiting
app.use('/api/', apiLimiter); // Proteger toda la API
app.use('/admin/auth', loginLimiter); // Proteger login de admin específicamente

app.get('/', (req, res) => {
  res.redirect('/admin');
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
app.use('/register', registerRoutes);
app.use('/invitados', invitadosRoutes);
app.use('/usuarios', usuariosRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});