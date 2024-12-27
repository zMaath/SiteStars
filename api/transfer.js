const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { Canvas, GlobalFonts } = require('@napi-rs/canvas'); // Importações do @napi-rs/canvas

const app = express();

const fieldImagePath = path.join(__dirname, '..', 'images', 'transfer.png');
const playersFolder = path.join(__dirname, '..', 'players');
const fontPath = path.join(__dirname, '..', 'fonts', 'a25-squanova.ttf');

// Registra a fonte no @napi-rs/canvas
if (!GlobalFonts.registerFromPath(fontPath, 'A25 SQUANOVA')) {
  console.error('Falha ao registrar a fonte.');
  process.exit(1);
}

// Posições fixas no campo para os jogadores e valores
const positions = [
  { top: 80, left: 145 },   // Posição jogador 1
  { top: 80, left: 345 },   // Posição jogador 2
  { top: 80, left: 545 },   // Posição jogador 3
];

const valuePositions = [
  { top: 290, left: 110 },  // Valor do jogador 1
  { top: 290, left: 310 },  // Valor do jogador 2
  { top: 290, left: 510 },  // Valor do jogador 3
];

const DescontPositions = [
  { top: 400, left: 180 },  // Valor do jogador 1
  { top: 400, left: 380 },  // Valor do jogador 2
  { top: 400, left: 580 },  // Valor do jogador 3
];

app.get('/api/transfer', async (req, res) => {
  try {
    const { jogador1, jogador2, jogador3, dinheiro1, dinheiro2, dinheiro3, porcentagem, comprado1, comprado2, comprado3 } = req.query;

    // Verifica se a imagem do campo existe
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
    
      let playerImage = sharp(imagePath).resize(225, 250);
    
      // Aplica o filtro de preto e branco se "comprado" for true
      if (comprado === 'true') { // 'true' vem como string em req.query
        playerImage = playerImage.modulate({ saturation: 0 });
      }
    
      const buffer = await playerImage.toBuffer();
    
      // Se comprado for true, adicionar texto "VENDER"
      if (comprado === 'true') {
        const canvas = new Canvas(225, 250);
        const ctx = canvas.getContext('2d');
    
        // Preenche o canvas com a imagem do buffer
        const img = sharp(buffer).raw().toBuffer({ resolveWithObject: true });
        const { data, info } = await img;
        const imageData = ctx.createImageData(info.width, info.height);
        imageData.data.set(data);
        ctx.putImageData(imageData, 0, 0);
    
        // Configurações do texto
        ctx.font = 'bold 27px "A25 SQUANOVA"';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
    
        // Desenha o texto com contorno
        ctx.strokeText('COMPRADO', 112.5, 125); // Centro da carta
        ctx.fillText('COMPRADO', 112.5, 125);
    
        // Retorna o buffer com o texto sobreposto
        return { input: canvas.toBuffer('image/png'), top: positions[index].top, left: positions[index].left };
      }
    
      // Retorna a imagem original sem o texto
      return { input: buffer, top: positions[index].top, left: positions[index].left };
    };
    const processCombinedText = async (value, index) => {
      if (!value) return null;
    
      const desconto = value - (value * (porcentagem/100));
      const formattedTextOriginal = `De: R$ ${parseInt(Number(value)).toLocaleString('pt-BR')}`;
      const formattedTextDesconto = `Por: R$ ${parseInt(Number(desconto)).toLocaleString('pt-BR')}`;
    
      // Cria um canvas para renderizar os textos
      const canvas = new Canvas(900, 415); // Define o tamanho do canvas
      const context = canvas.getContext('2d');
    
      context.textAlign = 'center';
      context.fillStyle = '#DA0001'; // Cor do texto
    
      // Texto Original
      context.font = '19px "A25 SQUANOVA"';
      context.lineWidth = 4; // Largura do contorno (ajuste conforme necessário)
context.strokeStyle = '#FFFFFF'; // Cor do contorno (branco)
context.lineJoin = 'round'; // Suaviza os cantos do contorno

// Desenha o contorno do texto
context.strokeText(formattedTextOriginal, 150, 50);
      context.fillText(formattedTextOriginal, 150, 50);
    
      // Texto Desconto
      context.strokeText(formattedTextDesconto, 150, 90);
      context.fillText(formattedTextDesconto, 150, 90);
    
      return {
        input: await canvas.toBuffer('image/png'), // O @napi-rs/canvas requer especificar o formato
        top: valuePositions[index].top,
        left: valuePositions[index].left,
      };
    };

    // Processa as imagens dos jogadores
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
  console.log(`Server running on port ${PORT}`);
});