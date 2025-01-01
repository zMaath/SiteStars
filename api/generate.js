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
      { top: 763, left: 430 }, { top: 648, left: 229 }, { top: 648, left: 627 },
      { top: 528, left: 847 }, { top: 528, left: 13 }, { top: 433, left: 430 },
      { top: 306, left: 624 }, { top: 226, left: 253 }, { top: 84, left: 66 },
      { top: 32, left: 430 }, { top: 86, left: 794 },
    ]
  },
  '4-3-3B': {
    fieldImage: '433B.png',
    positions: [
      { top: 780, left: 430 }, { top: 665, left: 229 }, { top: 665, left: 627 },
      { top: 545, left: 847 }, { top: 544, left: 13 }, { top: 450, left: 430 },
      { top: 323, left: 624 }, { top: 243, left: 253 }, { top: 101, left: 66 },
      { top: 49, left: 430 }, { top: 103, left: 794 },
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
        .resize(225, 250)
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