const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const app = express();

const fieldImagesFolder = path.join(__dirname, '..', 'images');
const playersFolder = path.join(__dirname, '..', 'players');
const cache = new Map();

app.get('/api/generate', async (req, res) => {
  try {
    const { campo = 'normal', gk, jogador1, jogador2, jogador3, jogador4, jogador5, jogador6, jogador7, jogador8, jogador9, jogador10 } = req.query;

    const fieldImagePath = path.join(fieldImagesFolder, `${campo}.png`);
    if (!fs.existsSync(fieldImagePath)) {
      return res.status(404).send("Error: Field image not found.");
    }

    // Check if field image is cached; resize only if needed
    const fieldBuffer = cache.get(`field_${campo}`) || await sharp(fieldImagePath)
      .resize(1062, 1069)
      .toBuffer();
    cache.set(`field_${campo}`, fieldBuffer); // Cache the resized field image

    // Array of player IDs and positions
    const playerIds = [gk, jogador1, jogador2, jogador3, jogador4, jogador5, jogador6, jogador7, jogador8, jogador9, jogador10];
    const playerPositions = [
      { top: 791, left: 423 }, { top: 696, left: 223 }, { top: 699, left: 615 },
      { top: 572, left: 19 }, { top: 572, left: 822 }, { top: 479, left: 420 },
      { top: 321, left: 250 }, { top: 384, left: 615 }, { top: 162, left: 83 },
      { top: 168, left: 749 }, { top: 106, left: 418 }
    ];

    // Process player images in parallel and cache them
    const layers = await Promise.all(playerIds.map(async (id, index) => {
      if (!id || id === 'nenhum') return null;

      const cachedBuffer = cache.get(id);
      if (cachedBuffer) {
        return { input: cachedBuffer, top: playerPositions[index].top, left: playerPositions[index].left };
      }

      const imagePath = path.join(playersFolder, `${id}.png`);
      if (!fs.existsSync(imagePath)) return null;

      const buffer = await sharp(imagePath).resize(225, 240).toBuffer();
      cache.set(id, buffer); // Cache each player image
      return { input: buffer, top: playerPositions[index].top, left: playerPositions[index].left };
    }));

    const validLayers = layers.filter(layer => layer);

    // Compose final image with webp format and reduced quality to balance file size and quality
    const image = await sharp(fieldBuffer)
      .composite(validLayers)
      .webp({ quality: 85 }) // Quality can be adjusted as needed
      .toBuffer();

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