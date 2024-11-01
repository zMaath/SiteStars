const express = require('express');
const sharp = require('sharp');
const path = require('path');

const app = express();

app.post('/api/generate', async (req, res) => {
  try {
    // Caminho da imagem do campo (substitua pelo caminho correto no seu servidor)
    const fieldImagePath = path.join(__dirname, 'images', 'campo.jpg');
    console.log(`Usando a imagem do campo em: ${fieldImagePath}`);

    // Carrega a imagem do campo
    const fieldImage = await sharp(fieldImagePath).resize(700, 800).toBuffer();

    // Retorna a imagem do campo como resposta
    res.setHeader('Content-Type', 'image/png');
    res.send(fieldImage);
  } catch (error) {
    console.error("Erro ao gerar imagem:", error.message);
    res.status(500).send(`Erro ao gerar imagem: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});