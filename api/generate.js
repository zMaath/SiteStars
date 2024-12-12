const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const express = require('express')

const app = express();

const fieldImagesFolder = path.join(__dirname, '..', 'campos');
const playersFolder = path.join(__dirname, '..', 'players');

//formações
const formations = {
  '4-3-3': {
    fieldImage: '433.png',
    positions: [
      { top: 806, left: 434 }, { top: 715, left: 237 }, { top: 715, left: 627 },
      { left: 200, top: 720 }, { top: 586, left: 836 }, { top: 493, left: 435 },
      { top: 300, left: 250 }, { top: 177, left: 135 }, { top: 359, left: 217 },
      { top: 178, left: 763 }, { top: 177, left: 536 }
    ]
  },
  '4-3-3B': {
    fieldImage: '433B.png',
    positions: [
      { top: 791, left: 423 }, { top: 696, left: 223 }, { top: 699, left: 615 },
      { top: 600, left: 206 }, { top: 572, left: 822 }, { top: 479, left: 420 },
      { top: 321, left: 250 }, { top: 384, left: 615 }, { top: 162, left: 83 },
      { top: 168, left: 749 }, { top: 106, left: 418 }
    ]
  },
  '4-4-2': {
    fieldImage: '442.png',
    positions: [
      { top: 806, left: 434 }, { top: 715, left: 237 }, { top: 715, left: 627 },
      { top: 111, left: 0 }, { top: 586, left: 836 }, { top: 411, left: 288 },
      { top: 411, left: 580 }, { top: 341, left: 73 }, { top: 341, left: 785 },
      { top: 125, left: 276 }, { top: 125, left: 585 }, 
    ]
  },
};

app.get('/api/generate', async (req, res) => {
  try {
    const {
      formacao = '4-3-3',
      gk,
      jogador1, jogador2, jogador3, jogador4,
      jogador5, jogador6, jogador7,
      jogador8, jogador9, jogador10
    } = req.query;

    const formation = formations[formacao] || formations['4-3-3'];

    const fieldImagePath = path.join(fieldImagesFolder, formation.fieldImage);
    if (!fs.existsSync(fieldImagePath)) {
      return res.status(404).send(`Não foi possível encontrar a formação ${formation} no banco de imagens.`);
    }

    const fieldBuffer = await sharp(fieldImagePath).toBuffer();

    const playerIds = [gk, jogador1, jogador2, jogador3, jogador4, jogador5, jogador6, jogador7, jogador8, jogador9, jogador10];

    const processPlayerImage = async (id, index) => {
      if (!id || id === 'nenhum') return null;

      const imagePath = path.join(playersFolder, `${id}.png`);
      if (!fs.existsSync(imagePath)) return null;

      const buffer = await sharp(imagePath)
        .resize(175, 225)
        .toBuffer();
      return { input: buffer, top: formation.positions[index].top, left: formation.positions[index].left };
    };

    const layers = await Promise.all(playerIds.map((id, index) => processPlayerImage(id, index)));
    const validLayers = layers.filter(layer => layer);

    const image = await sharp(fieldBuffer)
      .composite(validLayers)
      .webp({ quality: 90 })
      .toBuffer();

    res.setHeader('Content-Type', 'image/webp');
    res.send(image);

  } catch (error) {
    console.error("Erro para gerar a imagem:", error.message);
    res.status(500).send(`Erro para gerar a imagem: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});