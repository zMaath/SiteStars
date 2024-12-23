const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { registerFont, createCanvas } = require('canvas');

const app = express();

const fieldImagePath = path.join(__dirname, '..', 'images', 'transfer.png');
const playersFolder = path.join(__dirname, '..', 'players');
const fontPath = path.join(__dirname, '..', 'fonts', 'a25-squanova.ttf');
registerFont(fontPath, { family: 'A25 SQUANOVA' })

// Posições fixas no campo para os jogadores e valores
const positions = [
  { top: 80, left: 100 },   // Posição jogador 1
  { top: 80, left: 320 },   // Posição jogador 2
  { top: 80, left: 540 },   // Posição jogador 3
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

      // Cria um canvas para renderizar o texto
      const canvas = createCanvas(900, 415);
      const context = canvas.getContext('2d');

      context.textAlign = 'left';
      context.fillStyle = '#FFFFFF';
      context.font = '40px "A25 SQUANOVA"';
      context.fillText(value, 0, 50);

      return {
        input: canvas.toBuffer(),
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