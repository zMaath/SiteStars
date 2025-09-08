const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/cards/:imageName', (req, res) => {
  const imageName = req.params.imageName;
  const localPath = path.resolve('public', 'cards', imageName);

  if (!fs.existsSync(localPath)) {
    return res.status(404).send('Imagem não encontrada');
  }

  res.set('Content-Type', 'image/webp');
  res.set('Cache-Control', 'public, max-age=31536000, immutable');

  return res.sendFile(localPath);
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});