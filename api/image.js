const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/cards/:id', (req, res) => {
  const imageId = req.params.id;
  const imagePath = path.join(__dirname, '..', 'public', 'cards', imageId);

  res.sendFile(imagePath, err => {
    if (err) {
      console.error('Erro ao enviar imagem:', err);
      res.status(404).send('Imagem não encontrada');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});