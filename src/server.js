const express = require('express');
const apiRoutes = require('./apis');
const app = express();

app.use(express.json());
app.use('/api', apiRoutes);

app.listen(3000, () => console.log('Server running on port 3000'));