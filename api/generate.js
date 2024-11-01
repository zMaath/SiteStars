const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

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

    // URLs das imagens dos jogadores
    const playerImages = [
      "https://site-stars.vercel.app/cards/yqhhxzhqlogpontjpoyb.png",
      "https://site-stars.vercel.app/cards/dtiuo6hxnvxsmq1mu9o9.png"
    ];

    // Carrega e sobrepõe as imagens dos jogadores
    const playerBuffers = await Promise.all(
      playerImages.map(async (url) => {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        // Redimensiona a imagem do jogador para 300x400 pixels
        return await sharp(response.data).resize(100, 200).toBuffer();
      })
    );

    // Cria a imagem final
    let image = sharp(fieldImage);

    // Sobrepõe cada imagem de jogador na posição desejada
    playerBuffers.forEach((playerBuffer, index) => {
      // Defina a posição (x, y) para cada jogador, ajuste conforme necessário
      const x = 100 + (index * 100); // Posição x de cada jogador
      const y = 200; // Posição y comum para todos os jogadores
      image = image.composite([{ input: playerBuffer, top: y, left: x }]);
    });

    // Redimensiona a imagem final se necessário
    const outputBuffer = await image.png().toBuffer();
    
    res.setHeader('Content-Type', 'image/png');
    res.send(outputBuffer);

  } catch (error) {
    console.error("Erro ao gerar a imagem:", error.message);
    res.status(500).send(`Erro ao gerar a imagem: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});