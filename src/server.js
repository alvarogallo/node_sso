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

// Rate limiting con MUCHO debugging
const loginLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutos para pruebas
  max: 3, // Solo 3 intentos
  standardHeaders: true,
  legacyHeaders: false,
  
  // REMOVER skipSuccessfulRequests para que cuente TODO
  // skipSuccessfulRequests: true,
  
  // Handler personalizado con logs
  handler: (req, res, next) => {
    console.log('🚫🚫🚫 RATE LIMIT HIT! 🚫🚫🚫');
    console.log('IP:', req.ip);
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    
    res.status(429).json({
      error: '🚫 BLOQUEADO POR RATE LIMITING - Demasiados intentos',
      code: 'RATE_LIMITED',
      ip: req.ip,
      attempts: req.rateLimit.current,
      maxAttempts: req.rateLimit.limit
    });
  },
  
  // Log cada request que pasa por el rate limiter
  onLimitReached: (req, res, options) => {
    console.log('⚠️ Rate limit reached for IP:', req.ip);
  },
  
  // Mensaje para cuando NO está bloqueado aún
  message: {
    error: 'Demasiados intentos de login. Inténtalo más tarde.'
  }
});

// Middleware de debugging
const debugMiddleware = (req, res, next) => {
  if (req.path === '/admin/auth') {
    console.log('🔍 DEBUG AUTH REQUEST:');
    console.log('- IP:', req.ip);
    console.log('- Method:', req.method);
    console.log('- Path:', req.path);
    console.log('- Rate limit info:', req.rateLimit);
  }
  next();
};

app.use(express.json());
app.use(cookieParser());

// IMPORTANTE: Aplicar rate limiting ANTES de las rutas
console.log('🔧 Setting up rate limiting for /admin/auth');

// Aplicar debug a todas las requests de auth
app.use('/admin/auth', debugMiddleware);

// Aplicar rate limiting ESPECÍFICAMENTE a /admin/auth
app.use('/admin/auth', (req, res, next) => {
  console.log('🛡️ Rate limiter middleware executing for:', req.path);
  next();
}, loginLimiter);

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
  console.log('🛡️ Rate limiting configured for /admin/auth');
});