const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const app = express();

const fieldImagesFolder = path.join(__dirname, '..', 'images');
const playersFolder = path.join(__dirname, '..', 'players');

const cache = new Map(); // Cache for resized images

app.get('/api/generate', async (req, res) => {
  try {
    const { campo = 'normal', gk, jogador1, jogador2, jogador3, jogador4, jogador5, jogador6, jogador7, jogador8, jogador9, jogador10 } = req.query;

    // Field Image Path
    const fieldImagePath = campo === 'normal' 
      ? path.join(fieldImagesFolder, 'campo.png') 
      : path.join(fieldImagesFolder, `${campo}.png`);

    if (!fs.existsSync(fieldImagePath)) {
      return res.status(404).send("Error: Field image not found.");
    }

    // Load and cache the field image only once
    let fieldBuffer = cache.get(`field_${campo}`);
    if (!fieldBuffer) {
      fieldBuffer = await sharp(fieldImagePath).resize(1062, 1069).toBuffer();
      cache.set(`field_${campo}`, fieldBuffer);
    }

    // Player positions
    const playerIds = [gk, jogador1, jogador2, jogador3, jogador4, jogador5, jogador6, jogador7, jogador8, jogador9, jogador10];
    const playerPositions = [
      { top: 791, left: 423 }, { top: 696, left: 223 }, { top: 699, left: 615 },
      { top: 572, left: 19 }, { top: 572, left: 822 }, { top: 479, left: 420 },
      { top: 321, left: 250 }, { top: 384, left: 615 }, { top: 162, left: 83 },
      { top: 168, left: 749 }, { top: 106, left: 418 }
    ];

    // Prepare the layers
    const layers = await Promise.all(playerIds.map(async (id, index) => {
      if (!id || id === 'nenhum') return null;

      const imagePath = path.join(playersFolder, `${id}.png`);
      if (!fs.existsSync(imagePath)) return null;

      // Check cache for the resized buffer
      let buffer = cache.get(id);
      if (!buffer) {
        buffer = await sharp(imagePath).resize(225, 240).toBuffer();
        cache.set(id, buffer);
      }

      return { input: buffer, top: playerPositions[index].top, left: playerPositions[index].left };
    }));

    // Filter out any null values from the layers array
    const validLayers = layers.filter(layer => layer);

    // Generate the final image with improved quality
    const image = await sharp(fieldBuffer)
      .composite(validLayers)
      .webp({ quality: 90 }) // Adjust quality for better compression without loss
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