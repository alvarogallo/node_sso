const express = require('express');
const apiRoutes = require('./apis');
const pool = require('./conexion');

const app = express();
const port = 3000;

app.use(express.json());

app.get('/test', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ message: 'Conexión exitosa' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});