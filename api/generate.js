const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();

app.post('/api/generate', async (req, res) => {
  try {
    // Caminho da imagem do campo
    const fieldImagePath = path.join(__dirname, '..', 'images', 'campo.jpg');
    console.log(`Tentando carregar a imagem do campo em: ${fieldImagePath}`);

    // Verifica se o arquivo existe
    if (!fs.existsSync(fieldImagePath)) {
      console.error("Erro: A imagem do campo não foi encontrada no caminho especificado.");
      return res.status(404).send("Erro: A imagem do campo não foi encontrada.");
    }

    // Carrega e redimensiona a imagem do campo
    const fieldImage = await sharp(fieldImagePath).resize(700, 800).toBuffer();

    // Retorna a imagem do campo como resposta
    res.setHeader('Content-Type', 'image/png');
    res.send(fieldImage);

  } catch (error) {
    console.error("Erro ao gerar a imagem:", error.message);
    res.status(500).send(`Erro ao gerar a imagem: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});