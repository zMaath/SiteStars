const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { Canvas, GlobalFonts } = require('@napi-rs/canvas');
const axios = require('axios');

const app = express();

const fieldImagePath = path.join(__dirname, '..', 'images', 'mercado.png');
const fontPath = path.join(__dirname, '..', 'fonts', 'a25-squanova.ttf');

if (!GlobalFonts.registerFromPath(fontPath, 'A25 SQUANOVA')) {
  console.error('Falha ao registrar a fonte.');
  process.exit(1);
} 

const positions = [
  { top: 180, left: 100 },
  { top: 180, left: 580 },
  { top: 180, left: 1055 },
];

const valuePositions = [
  { top: 220, left: 70 },
  { top: 220, left: 555 },
  { top: 220, left: 1030 },
];

async function getImageBufferFromPublic(id) {
  const url = `https://ustars.vercel.app/cards/${id}.png`;
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
  } catch (err) {
    console.warn(`Erro ao baixar imagem do jogador ${id}: ${err.message}`);
    return null;
  }
}

app.get('/api/mercado', async (req, res) => {
  try {
    const {
      jogador1, jogador2, jogador3,
      dinheiro1, dinheiro2, dinheiro3,
      colecao1, colecao2, colecao3,
      porcentagem,
      comprado1, comprado2, comprado3
    } = req.query;

    if (!fs.existsSync(fieldImagePath)) {
      return res.status(404).send(`Imagem do campo não encontrada.`);
    }

    const fieldBuffer = await sharp(fieldImagePath).toBuffer();

    const playerIds = [jogador1, jogador2, jogador3];
    const dinheiro = [dinheiro1, dinheiro2, dinheiro3];
    const compradoFlags = [comprado1, comprado2, comprado3];
    const colecoes = [colecao1, colecao2, colecao3];

    const colecaoMap = {
      'CartasBase': 'base',
      'Mundial': 'mundial',
      'AGrandeConquista': 'sula',
      'GloriaEterna': 'liberta',
      'TributoaosClassicos': 'tributo',
      'Codinome': 'codi',
      'MundialCampeao': 'mundialcampeao',
      'CraquesMensais': 'craquesmensais',
      'CopadoBrasil': 'copabrasil',
      'InteligenciaTatica': 'inte',
      'ChampionsLeague': 'cham',
    };

    const processPlayerImage = async (id, index, comprado, colecao) => {
      if (!id || id === 'nenhum') return null;

      const bufferImage = await getImageBufferFromPublic(id);
      if (!bufferImage) return null;

      let playerImage = sharp(bufferImage).resize(350, 500);

      if (comprado === 'true') {
        playerImage = playerImage.modulate({ saturation: 0 });
      }
      const playerBuffer = await playerImage.toBuffer();

      let finalPlayerBuffer = playerBuffer;

      if (comprado === 'true') {
        const canvas = new Canvas(350, 500);
        const ctx = canvas.getContext('2d');

        const { data, info } = await sharp(playerBuffer).raw().toBuffer({ resolveWithObject: true });
        const imageData = ctx.createImageData(info.width, info.height);
        imageData.data.set(data);
        ctx.putImageData(imageData, 0, 0);

        ctx.font = 'bold 40px "A25 SQUANOVA"';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.strokeText('COMPRADO', 175, 250);
        ctx.fillText('COMPRADO', 175, 250);

        finalPlayerBuffer = canvas.toBuffer('image/webp');
      }

      let baseLayer = null;
      if (colecao && colecaoMap[colecao]) {
        const folderKey = colecaoMap[colecao];
        const subFolder = `${folderKey}${index + 1}`;
        const basePath = path.join(__dirname, '..', 'images', folderKey, `${subFolder}.png`);

        if (fs.existsSync(basePath)) {
          let baseImage = sharp(basePath);

          if (comprado === 'true') {
            baseImage = baseImage.modulate({ saturation: 0 });
          }

          const baseBuffer = await baseImage.toBuffer();

          baseLayer = {
            input: baseBuffer,
            top: 0,
            left: 0
          };
        } else {
          console.warn(`Imagem da base não encontrada: ${basePath}`);
        }
      }

      return [
        baseLayer,
        {
          input: finalPlayerBuffer,
          top: positions[index].top,
          left: positions[index].left
        }
      ].filter(Boolean);
    };

    const processCombinedText = async (value, index) => {
      if (!value) return null;

      const toAbbrev = (num) => {
        if (!num || isNaN(num)) return "0";
        if (typeof num === "string") num = parseInt(num);
        let decPlaces = Math.pow(10, 1);
        var abbrev = ["K", "M", "B", "T"];
        for (var i = abbrev.length - 1; i >= 0; i--) {
          var size = Math.pow(10, (i + 1) * 3);
          if (size <= num) {
            num = Math.round((num * decPlaces) / size) / decPlaces;
            if (num == 1000 && i < abbrev.length - 1) {
              num = 1;
              i++;
            }
            num += abbrev[i];
            break;
          }
        }
        return num;
      };

      const desconto = value - (value * (porcentagem / 100));
      const formattedTextDesconto = `R$ ${toAbbrev(desconto)}`;

      const canvas = new Canvas(1500, 900);
      const context = canvas.getContext('2d');

      context.textAlign = 'center';
      context.fillStyle = '#FFFFFF';
      context.font = '50px "A25 SQUANOVA"';
      context.shadowColor = '#000000';
      context.shadowBlur = 4;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;

      context.strokeText(formattedTextDesconto, 200, 500);
      context.fillText(formattedTextDesconto, 200, 500);

      return {
        input: await canvas.toBuffer('image/webp'),
        top: valuePositions[index].top,
        left: valuePositions[index].left,
      };
    };

    const playerLayersArrays = await Promise.all(
      playerIds.map((id, index) => processPlayerImage(id, index, compradoFlags[index], colecoes[index]))
    );
    const playerLayers = playerLayersArrays.flat();

    const valueLayers = await Promise.all(dinheiro.map((value, index) => processCombinedText(value, index)));

    const allLayers = [...playerLayers, ...valueLayers].filter(Boolean);

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
  console.log(`Servidor rodando na porta ${PORT}`);
});