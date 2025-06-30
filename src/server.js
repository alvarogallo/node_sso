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
    console.log('⚠️ Rate limit reached for IP:', req.ip); // Movido aquí desde onLimitReached
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
  
  // Mensaje para cuando NO está bloqueado aún (esto se usa como fallback)
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


//aaa

app.get('/test', async (req, res) => {
  try {
    console.log('🔍 Testing database connection...');
    
    const connection = await pool.getConnection();
    console.log('✅ Database connection acquired');
    
    // Ejecutar una query simple para verificar que todo funciona
    const [result] = await connection.query('SELECT 1 as test, NOW() as current_time');
    console.log('✅ Test query executed successfully:', result[0]);
    
    // Verificar que las tablas principales existen
    const [tables] = await connection.query("SHOW TABLES");
    const tableNames = tables.map(table => Object.values(table)[0]);
    console.log('📋 Available tables:', tableNames);
    
    connection.release();
    console.log('✅ Database connection released');
    
    res.json({ 
      success: true,
      message: 'Conexión exitosa ✅',
      timestamp: new Date().toISOString(),
      database: {
        host: process.env.MYSQLHOST?.split(':')[0] || 'unknown',
        port: 36100,
        database: process.env.DB_NAME || 'unknown',
        user: process.env.DB_USER || 'unknown'
      },
      tables: tableNames,
      testQuery: result[0]
    });
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    
    res.status(500).json({ 
      success: false,
      error: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      timestamp: new Date().toISOString(),
      config: {
        host: process.env.MYSQLHOST?.split(':')[0] || 'No configurado',
        port: 36100,
        database: process.env.DB_NAME || 'No configurado',
        user: process.env.DB_USER || 'No configurado',
        passwordSet: !!process.env.DB_PASSWORD
      }
    });
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