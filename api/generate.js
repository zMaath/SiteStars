const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const app = express();

const fieldImagesFolder = path.join(__dirname, '..', 'images');
const playersFolder = path.join(__dirname, '..', 'players');

const cache = new Map(); // Cache para imagens redimensionadas

app.get('/api/generate', async (req, res) => {
  try {
    const { campo = 'normal', gk, jogador1, jogador2, jogador3, jogador4, jogador5, jogador6, jogador7, jogador8, jogador9, jogador10 } = req.query;

    // Caminho da imagem do campo
    const fieldImagePath = (campo === 'normal') 
      ? path.join(fieldImagesFolder, 'campo.png') 
      : path.join(fieldImagesFolder, `${campo}.png`);

    if (!fs.existsSync(fieldImagePath)) {
      return res.status(404).send("Erro: Imagem do campo não encontrada.");
    }

    // Carrega a imagem do campo apenas uma vez
    const fieldBuffer = await sharp(fieldImagePath).resize(1062, 1069).toBuffer();

    const playerIds = [gk, jogador1, jogador2, jogador3, jogador4, jogador5, jogador6, jogador7, jogador8, jogador9, jogador10];
    const playerPositions = [
      { top: 791, left: 423 }, // GK
      { top: 696, left: 223 }, { top: 699, left: 615 }, // ZAG
      { top: 572, left: 19 }, { top: 572, left: 822 },  // LE, LD
      { top: 479, left: 420 }, // VOL
      { top: 321, left: 250 }, { top: 384, left: 615 }, // MEI, MC
      { top: 162, left: 83 }, { top: 168, left: 749 },  // PE, PD
      { top: 106, left: 418 }  // CA
    ];

    const layers = [];
    for (let i = 0; i < playerIds.length; i++) {
      const id = playerIds[i];
      if (!id || id === 'nenhum') continue;

      const imagePath = path.join(playersFolder, `${id}.png`);
      if (!fs.existsSync(imagePath)) continue;

      let buffer = cache.get(id);
      if (!buffer) {
        buffer = await sharp(imagePath).resize(225, 240).toBuffer();
        cache.set(id, buffer); // Armazena na cache
      }

      layers.push({ input: buffer, top: playerPositions[i].top, left: playerPositions[i].left });
    }

    const image = await sharp(fieldBuffer).composite(layers).webp().toBuffer();
    res.setHeader('Content-Type', 'image/webp');
    res.send(image);

  } catch (error) {
    console.error("Erro ao gerar a imagem:", error.message);
    res.status(500).send(`Erro ao gerar a imagem: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});