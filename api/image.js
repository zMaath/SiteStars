const express = require('express');
const path = require('path');
const app = express();
const fetch = global.fetch;
const PORT = process.env.PORT || 3000;

app.get('/cards/:imageName', async (req, res) => {
  const imageName = req.params.imageName;

  try {
    const response = await fetch(`https://square-king-9088.zmathdiscord.workers.dev/cards/${imageName}`);

    if (!response.ok) {
      return res.status(response.status).send('Imagem não encontrada');
    }

    res.set('Content-Type', response.headers.get('content-type') || 'image/png');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');

    const buffer = Buffer.from(await response.arrayBuffer());
    return res.send(buffer);
  } catch (error) {
    console.error('Erro ao buscar imagem do Worker:', error);
    return res.status(500).send('Erro ao carregar imagem');
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});