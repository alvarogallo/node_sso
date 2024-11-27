const express = require('express');
const apiRoutes = require('./apis');
const pool = require('./conexion');

const app = express();
const port = 3000;

app.use(express.json());

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

app.get('/', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT COUNT(*) as total FROM users');
    res.json({ total_users: result[0].total });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});