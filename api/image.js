const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.use('/cards', express.static(path.join(__dirname, '..', 'public', 'cards'), {
  maxAge: '30d',
  immutable: true
}));

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
})