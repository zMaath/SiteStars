const express = require('express');
const path = require('path');

const app = express();

const upRoute = require('./api/up');
app.use('/api/up', upRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
})