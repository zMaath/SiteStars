const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const express = require('express')

const app = express();

const fieldImagesFolder = path.join(__dirname, '..', 'campos');
const playersFolder = path.join(__dirname, '..', 'players');

const formations = {
  '4-3-3': {
    fieldImage: '433.png',
    positions: [
      { top: 573, left: 324 }, { top: 489, left: 175 }, { top: 489, left: 470 },
      { top: 401, left: 633 }, { top: 400, left: 14 }, { top: 329, left: 324 },
      { top: 236, left: 466 }, { top: 176, left: 192 }, { top: 72, left: 53 },
      { top: 33, left: 324 }, { top: 73, left: 593 }
    ]
  },
  '4-3-3B': {
    fieldImage: '433B.png',
    positions: [
      { top: 573, left: 324 }, { top: 489, left: 175 }, { top: 489, left: 470 },
      { top: 401, left: 633 }, { top: 400, left: 14 }, { top: 329, left: 324 },
      { top: 236, left: 466 }, { top: 176, left: 192 }, { top: 72, left: 53 },
      { top: 33, left: 324 }, { top: 73, left: 593 }
    ]
  },
  '4-2-4': {
    fieldImage: '424.png',
    positions: [
      { top: 573, left: 324 },
{ top: 489, left: 175 }, { top: 489, left: 470 }, { top: 401, left: 632 }, { top: 400, left: 14 },
{ top: 345, left: 326 }, { top: 130, left: 325 },
{ top: 81, left: 51 }, { top: 16, left: 187 }, { top: 16, left: 465 }, { top: 81, left: 596 }
    ]
  },
  '4-2-4B': {
    fieldImage: '424B.png',
    positions: [
      { top: 573, left: 324 },
{ top: 489, left: 175 }, { top: 489, left: 470 }, { top: 401, left: 632 }, { top: 400, left: 14 },
{ top: 345, left: 326 }, { top: 129, left: 324 },
{ top: 78, left: 51 }, { top: 17, left: 187 }, { top: 17, left: 459 }, { top: 78, left: 594 }
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
        .resize(155, 180)
        .toBuffer();
      return { input: buffer, top: formation.positions[index].top, left: formation.positions[index].left };
    };

    const layers = await Promise.all(playerIds.map((id, index) => processPlayerImage(id, index)));
    const validLayers = layers.filter(layer => layer);

    const image = await sharp(fieldBuffer)
      .composite(validLayers)
      .webp({ quality: 100 })
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
  console.log(`Servidor rodando na porta ${PORT}`);
});