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
      { top: 588, left: 332 }, { top: 504, left: 183 }, { top: 504, left: 478 },
      { top: 416, left: 641 }, { top: 415, left: 22 }, { top: 344, left: 332 },
      { top: 251, left: 474 }, { top: 191, left: 200 }, { top: 87, left: 61 },
      { top: 48, left: 332 }, { top: 88, left: 601 },
    ]
  },
  '4-3-3B': {
    fieldImage: '433B.png',
    positions: [
      { top: 578, left: 327 }, { top: 494, left: 178 }, { top: 494, left: 471 },
      { top: 406, left: 636 }, { top: 405, left: 18 }, { top: 334, left: 327 },
      { top: 241, left: 469 }, { top: 181, left: 195 }, { top: 77, left: 56 },
      { top: 38, left: 327 }, { top: 78, left: 596 },
    ]
  },
  '4-2-4': {
    fieldImage: '424.png',
    positions: [
      { top: 588, left: 332 },
      { top: 504, left: 183 }, { top: 504, left: 478 }, { top: 416, left: 640 }, { top: 415, left: 22 },
      { top: 360, left: 334 }, { top: 145, left: 333 }, 
      { top: 96, left: 59 }, { top: 31, left: 195 }, { top: 31, left: 473 }, { top: 96, left: 604 },
    ]
  },
};
/*
'4-2-4': [
  'goleiro',
  'zagueiros.0', 'zagueiros.1',
  'laterais.direito', 'laterais.esquerdo',
  'volante.0',
  'atacantes.meiaAtacante.0',
  'atacantes.pontaEsquerda', 'atacantes.centroavante.0', 'atacantes.centroavante.1', 'atacantes.pontaDireita',
],
*/

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
        .resize(140, 165)
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
  console.log(`Server running on port ${PORT}`);
});