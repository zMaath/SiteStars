const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { Canvas, GlobalFonts, loadImage } = require('@napi-rs/canvas');

const app = express();

const fieldImagePath = path.join(__dirname, '..', 'images', 'quiz.png');
const fontPath = path.join(__dirname, '..', 'fonts', 'a25-squanova.ttf');

if (!GlobalFonts.registerFromPath(fontPath, 'A25 SQUANOVA')) {
  console.error('Falha ao registrar a fonte.');
  process.exit(1);
}

app.get('/api/quiz', async (req, res) => {
  try {
    const { pergunta } = req.query;

    if (!fs.existsSync(fieldImagePath)) {
      return res.status(404).send(`Imagem do campo não encontrada.`);
    }

    const canvas = new Canvas(800, 338);
    const ctx = canvas.getContext('2d');

    const imagem = await loadImage(fieldImagePath); 
    await ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height)
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    
    ctx.font = '30px "A25 SQUANOVA"';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#00c7ff';
    ctx.lineJoin = 'round';

      const linhas = pergunta.match(/.{1,45}/g);

      linhas.forEach((linha, index) => {
        const posY = 169 + (index * 35);
        ctx.strokeText(linha, 400, posY);
        ctx.fillText(linha, 400, posY);
    });

    const buffer = canvas.toBuffer('image/webp', {
        quality: 1
    });

    res.setHeader('Content-Type', 'image/webp');
    res.send(buffer);
  } catch (error) {
    console.error("Erro ao gerar a imagem:", error.message);
    res.status(500).send(`Erro ao gerar a imagem: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});