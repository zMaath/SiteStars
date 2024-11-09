const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const app = express();

const fieldImagesFolder = path.join(__dirname, '..', 'images');
const playersFolder = path.join(__dirname, '..', 'players');

app.get('/api/generate', async (req, res) => {
  try {
    const { campo = 'normal', gk, jogador1, jogador2, jogador3, jogador4, jogador5, jogador6, jogador7, jogador8, jogador9, jogador10 } = req.query;

    const fieldImagePath = (campo === 'normal') 
      ? path.join(fieldImagesFolder, 'campo.png') 
      : path.join(fieldImagesFolder, `${campo}.png`);

    if (!fs.existsSync(fieldImagePath)) {
      console.error("Erro: Imagem do campo não encontrada no caminho:", fieldImagePath);
      return res.status(404).send("Erro: Imagem do campo não encontrada.");
    }

    let fieldImage = sharp(fieldImagePath);
    const fieldMetadata = await fieldImage.metadata();
    if (fieldMetadata.width !== 1062 || fieldMetadata.height !== 1069) {
      fieldImage = fieldImage.resize(1062, 1069);
    }
    const fieldBuffer = await fieldImage.toBuffer();

    const gkImagePath = gk && gk !== 'nenhum' ? path.join(playersFolder, `${gk}.png`) : null;
    const gkBuffer = gkImagePath && fs.existsSync(gkImagePath)
      ? await sharp(gkImagePath).resize(225, 240).toBuffer()
      : null;

    const playerIds = [jogador1, jogador2, jogador3, jogador4, jogador5, jogador6, jogador7, jogador8, jogador9, jogador10]
      .filter(id => id && id !== 'nenhum');
    
    const playerImages = playerIds
      .map(id => path.join(playersFolder, `${id}.png`))
      .filter(filePath => fs.existsSync(filePath));

    if (gkBuffer === null && playerImages.length === 0) {
      return res.status(404).send("Erro: Nenhuma imagem válida de goleiro ou jogador foi fornecida.");
    }

    const playerBuffers = await Promise.all(
      playerImages.map(async (imagePath) => {
        return sharp(imagePath).resize(225, 240).toBuffer();
      })
    );

    let image = sharp(fieldBuffer);  
    const layers = [];

    if (gkBuffer) {
      layers.push({
        input: gkBuffer,
        top: 791,
        left: 423,
      });
    }

    const playerPositions = [
      { top: 696, left: 223 }, // ZAG
      { top: 699, left: 615 }, // ZAG
      { top: 572, left: 19 },  // LE
      { top: 572, left: 822 }, // LD
      { top: 479, left: 420 }, // VOL
      { top: 321, left: 250 }, // MEI
      { top: 384, left: 615 }, // MC
      { top: 162, left: 83 }, // PE
      { top: 168, left: 749 }, // PD
      { top: 106, left: 418 },  // CA
    ];

    playerBuffers.forEach((buffer, index) => {
      const position = playerPositions[index];
      if (position) {
        layers.push({
          input: buffer,
          top: position.top,
          left: position.left,
        });
      }
    });

    image = image.composite(layers);

    const outputBuffer = await image.webp().toBuffer();
    res.setHeader('Content-Type', 'image/webp');
    res.send(outputBuffer);

  } catch (error) {
    console.error("Erro ao gerar a imagem:", error.message);
    res.status(500).send(`Erro ao gerar a imagem: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});