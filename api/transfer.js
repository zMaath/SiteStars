const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { Canvas, GlobalFonts } = require('@napi-rs/canvas');

const app = express();

const fieldImagePath = path.join(__dirname, '..', 'images', 'transfer.png');
const playersFolder = path.join(__dirname, '..', 'players');
const fontPath = path.join(__dirname, '..', 'fonts', 'a25-squanova.ttf');

if (!GlobalFonts.registerFromPath(fontPath, 'A25 SQUANOVA')) {
  console.error('Falha ao registrar a fonte.');
  process.exit(1);
}

const positions = [
  { top: 90, left: 165 },
  { top: 90, left: 365 },
  { top: 90, left: 565 },
];

const valuePositions = [
  { top: 290, left: 110 },
  { top: 290, left: 310 },
  { top: 290, left: 510 },
];

app.get('/api/transfer', async (req, res) => {
  try {
    const { jogador1, jogador2, jogador3, dinheiro1, dinheiro2, dinheiro3, porcentagem, comprado1, comprado2, comprado3 } = req.query;

    if (!fs.existsSync(fieldImagePath)) {
      return res.status(404).send(`Imagem do campo não encontrada.`);
    }

    const fieldBuffer = await sharp(fieldImagePath).toBuffer();

    const playerIds = [jogador1, jogador2, jogador3];
    const dinheiro = [dinheiro1, dinheiro2, dinheiro3];

    const processPlayerImage = async (id, index, comprado) => {
      if (!id || id === 'nenhum') return null;
    
      const imagePath = path.join(playersFolder, `${id}.png`);
      if (!fs.existsSync(imagePath)) return null;
    
      let playerImage = sharp(imagePath).resize(190, 215);
    
      if (comprado === 'true') {
        playerImage = playerImage.modulate({ saturation: 0 });
      }
    
      const buffer = await playerImage.toBuffer();
    
      if (comprado === 'true') {
        const canvas = new Canvas(190, 215);
        const ctx = canvas.getContext('2d');
    
        const img = sharp(buffer).raw().toBuffer({ resolveWithObject: true });
        const { data, info } = await img;
        const imageData = ctx.createImageData(info.width, info.height);
        imageData.data.set(data);
        ctx.putImageData(imageData, 0, 0);
    
        ctx.font = 'bold 25px "A25 SQUANOVA"';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
    
        ctx.strokeText('COMPRADO', 95, 107.5);
        ctx.fillText('COMPRADO', 95, 107.5);
    
        return { input: canvas.toBuffer('image/png'), top: positions[index].top, left: positions[index].left };
      }
    
      return { input: buffer, top: positions[index].top, left: positions[index].left };
    };
    const processCombinedText = async (value, index) => {
      if (!value) return null;
    
      const desconto = value - (value * (porcentagem/100));
      const formattedTextOriginal = `De: R$ ${parseInt(Number(value)).toLocaleString('pt-BR')}`;
      const formattedTextDesconto = `Por: R$ ${parseInt(Number(desconto)).toLocaleString('pt-BR')}`;
    
      const canvas = new Canvas(900, 415);
      const context = canvas.getContext('2d');
    
      context.textAlign = 'center';
      context.fillStyle = '#DA0001';
    
      context.font = '19px "A25 SQUANOVA"';
      context.lineWidth = 4;
context.strokeStyle = '#FFFFFF';
context.lineJoin = 'round';

context.strokeText(formattedTextOriginal, 150, 50);
      context.fillText(formattedTextOriginal, 150, 50);
    
      context.strokeText(formattedTextDesconto, 150, 90);
      context.fillText(formattedTextDesconto, 150, 90);
    
      return {
        input: await canvas.toBuffer('image/png'),
        top: valuePositions[index].top,
        left: valuePositions[index].left,
      };
    };

    const compradoFlags = [comprado1, comprado2, comprado3];
    const playerLayers = await Promise.all(playerIds.map((id, index) => processPlayerImage(id, index, compradoFlags[index])));
    const valueLayers = await Promise.all(dinheiro.map((value, index) => processCombinedText(value, index)));

    const allLayers = [...playerLayers, ...valueLayers].filter(layer => layer);

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