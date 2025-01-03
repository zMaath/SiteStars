const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { Canvas, GlobalFonts } = require('@napi-rs/canvas'); // Importações do @napi-rs/canvas

const app = express();

const fieldImagePath = path.join(__dirname, '..', 'images', 'comparativo.png');
const playersFolder = path.join(__dirname, '..', 'players');
const fontPath = path.join(__dirname, '..', 'fonts', 'a25-squanova.ttf');

// Registra a fonte no @napi-rs/canvas
if (!GlobalFonts.registerFromPath(fontPath, 'A25 SQUANOVA')) {
  console.error('Falha ao registrar a fonte.');
  process.exit(1);
}

// Posições fixas no campo para os jogadores e valores
const positions = [
  { top: 70, left: 125 },   // Posição jogador 1
  { top: 70, left: 430 },   // Posição jogador 2
];

app.get('/api/comparar', async (req, res) => {
  try {
    const { jogador1, jogador2 } = req.query;

    // Verifica se a imagem do campo existe
    if (!fs.existsSync(fieldImagePath)) {
      return res.status(404).send(`Imagem do campo não encontrada.`);
    }

    const fieldBuffer = await sharp(fieldImagePath).toBuffer();

    const playerIds = [jogador1, jogador2];

    const processPlayerImage = async (id, index) => {
      if (!id || id === 'nenhum') return null;
    
      const imagePath = path.join(playersFolder, `${id}.png`);
      if (!fs.existsSync(imagePath)) return null;
    
      let playerImage = sharp(imagePath).resize(190, 215);
    
      const buffer = await playerImage.toBuffer();   
      // Retorna a imagem original sem o texto
      return { input: buffer, top: positions[index].top, left: positions[index].left };
    };

    // Processa as imagens dos jogadores
    const playerLayers = await Promise.all(playerIds.map((id, index) => processPlayerImage(id, index)));

    const allLayers = [...playerLayers].filter(layer => layer);

    const image = await sharp(fieldBuffer)
      .composite(allLayers)
      .webp({ quality: 100 })
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