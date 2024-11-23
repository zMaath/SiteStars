const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const util = require('util');

const app = express();

const fieldImagesFolder = path.join(__dirname, '..', 'images');
const playersFolder = path.join(__dirname, '..', 'players');

app.get('/api/generate', async (req, res) => {
  try {
    const { campo = 'normal', gk, jogador1, jogador2, jogador3, jogador4, jogador5, jogador6, jogador7, jogador8, jogador9, jogador10 } = req.query;

    // Caminho da imagem do campo
    const fieldImagePath = campo === 'normal'
      ? path.join(fieldImagesFolder, 'campo.png')
      : path.join(fieldImagesFolder, `${campo}.png`);

    if (!fs.existsSync(fieldImagePath)) {
      return res.status(404).send("Error: Field image not found.");
    }

    // Carregar a imagem do campo uma vez e redimensionar
    const fieldBuffer = await sharp(fieldImagePath)
      .resize(1062, 1069)  // Ajuste o tamanho para o layout
      .toBuffer();

    // IDs e posições dos jogadores
    const playerIds = [gk, jogador1, jogador2, jogador3, jogador4, jogador5, jogador6, jogador7, jogador8, jogador9, jogador10];
    const playerPositions = [
      { top: 791, left: 423 }, { top: 696, left: 223 }, { top: 699, left: 615 },
      { top: 572, left: 19 }, { top: 572, left: 822 }, { top: 479, left: 420 },
      { top: 321, left: 250 }, { top: 384, left: 615 }, { top: 162, left: 83 },
      { top: 168, left: 749 }, { top: 106, left: 418 }
    ];

    // Função para processar a imagem de um jogador
    const processPlayerImage = (id, index) => {
      return new Promise(async (resolve, reject) => {
        if (!id || id === 'nenhum') return resolve(null);

        const imagePath = path.join(playersFolder, `${id}.png`);
        if (!fs.existsSync(imagePath)) return resolve(null);

        try {
          const buffer = await sharp(imagePath)
            .resize(225, 240)  // Redimensionar jogador para o tamanho desejado
            .toBuffer();
          resolve({ input: buffer, top: playerPositions[index].top, left: playerPositions[index].left });
        } catch (err) {
          reject(err);
        }
      });
    };

    // Processar todas as imagens dos jogadores em paralelo
    const layers = await Promise.all(playerIds.map((id, index) => processPlayerImage(id, index)));

    // Filtrar camadas válidas (não nulas)
    const validLayers = layers.filter(layer => layer);

    // Gerar a imagem final
    const image = await sharp(fieldBuffer)
      .composite(validLayers)
      .webp({ quality: 85 })  // Qualidade ajustada para balancear desempenho e qualidade
      .toBuffer();

    // Responder com a imagem gerada
    res.setHeader('Content-Type', 'image/webp');
    res.send(image);

  } catch (error) {
    console.error("Error generating image:", error.message);
    res.status(500).send(`Error generating image: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});