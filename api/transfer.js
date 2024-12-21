const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();

const fieldImagePath = path.join(__dirname, 'images', 'abc.png');
const playersFolder = path.join(__dirname, '..', 'players');

// Posições fixas no campo para os jogadores e valores
const positions = [
  { top: 100, left: 50 },   // Posição jogador 1
  { top: 250, left: 50 },   // Posição jogador 2
  { top: 400, left: 50 },   // Posição jogador 3
];

const valuePositions = [
  { top: 150, left: 300 },  // Valor do jogador 1
  { top: 300, left: 300 },  // Valor do jogador 2
  { top: 450, left: 300 },  // Valor do jogador 3
];

app.get('/api/transfer', async (req, res) => {
  try {
    const { jogador1, jogador2, jogador3, dinheiro1, dinheiro2, dinheiro3 } = req.query;

    // Verifica se a imagem do campo existe
    if (!fs.existsSync(fieldImagePath)) {
      return res.status(404).send(`Imagem do campo não encontrada.`);
    }

    const fieldBuffer = await sharp(fieldImagePath).toBuffer();

    const playerIds = [jogador1, jogador2, jogador3];
    const dinheiro = [dinheiro1, dinheiro2, dinheiro3];

    const processPlayerImage = async (id, index) => {
      if (!id || id === 'nenhum') return null;

      const imagePath = path.join(playersFolder, `${id}.png`);
      if (!fs.existsSync(imagePath)) return null;

      const buffer = await sharp(imagePath)
        .resize(225, 250)
        .toBuffer();
      return { input: buffer, top: positions[index].top, left: positions[index].left };
    };

    const processValueText = async (value, index) => {
      if (!value) return null;

      const svgBuffer = Buffer.from(`
        <svg width="400" height="100">
          <text x="0" y="50" font-size="40" fill="white">${value}</text>
        </svg>
      `);

      return {
        input: await sharp(svgBuffer).png().toBuffer(),
        top: valuePositions[index].top,
        left: valuePositions[index].left,
      };
    };

    // Processa as imagens dos jogadores
    const playerLayers = await Promise.all(playerIds.map((id, index) => processPlayerImage(id, index)));
    const valueLayers = await Promise.all(dinheiro.map((value, index) => processValueText(value, index)));

    const allLayers = [...playerLayers, ...valueLayers].filter(layer => layer);

    const image = await sharp(fieldBuffer)
      .composite(allLayers)
      .webp({ quality: 90 })
      .toBuffer();

    res.setHeader('Content-Type', 'image/webp');
    res.send(image);
  } catch (error) {
    console.error("Erro ao gerar a imagem:", error.message);
    res.status(500).send(`Erro ao gerar a imagem: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});