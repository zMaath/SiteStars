const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const express = require('express');
const axios = require('axios');
const { Canvas, GlobalFonts } = require('@napi-rs/canvas');

const app = express();

const fieldImagePath = path.join(__dirname, '..', 'images', 'draft.png');
const fontPath = path.join(__dirname, '..', 'fonts', 'a25-squanova.ttf');

if (!GlobalFonts.registerFromPath(fontPath, 'A25 SQUANOVA')) {
  console.error('Falha ao registrar a fonte.');
  process.exit(1);
}

const positions = [
  { top: 90, left: 155 },
  { top: 90, left: 355 },
  { top: 90, left: 555 },
];

async function getPlayerImageBuffer(id) {
  if (!id || id === 'nenhum') return null;

  const url = `https://ustars.vercel.app/cards/${id}.png`;
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    console.warn(`Imagem do jogador ${id} não encontrada ou erro no download.`);
    return null;
  }
}

app.get('/api/draft', async (req, res) => {
  try {
    const { jogador1, jogador2, jogador3 } = req.query;

    if (!fs.existsSync(fieldImagePath)) {
      return res.status(404).send(`Imagem do campo não encontrada.`);
    }

    const fieldBuffer = await sharp(fieldImagePath).toBuffer();

    const playerIds = [jogador1, jogador2, jogador3];

    const processPlayerImage = async (id, index) => {
      const buffer = await getPlayerImageBuffer(id);
      if (!buffer) return null;

      const resizedBuffer = await sharp(buffer).resize(190, 215).toBuffer();

      return {
        input: resizedBuffer,
        top: positions[index].top,
        left: positions[index].left,
      };
    };

    const playerLayers = await Promise.all(playerIds.map((id, index) => processPlayerImage(id, index)));
    const validLayers = playerLayers.filter(Boolean);

    const composedImage = await sharp(fieldBuffer)
      .composite(validLayers)
      .webp({ quality: 100 })
      .toBuffer();

    res.setHeader('Content-Type', 'image/webp');
    res.send(composedImage);

  } catch (error) {
    console.error('Erro ao gerar a imagem:', error.message);
    res.status(500).send(`Erro ao gerar a imagem: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});