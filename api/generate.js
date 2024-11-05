const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const app = express();

const fieldImagesFolder = path.join(__dirname, 'images');
const playersFolder = path.join(__dirname, 'players');

app.get('/api/generate', async (req, res) => {
  try {
    const { campo = 'normal', jogador1, jogador2 } = req.query;

    const fieldImagePath = (campo === 'normal') 
      ? path.join(fieldImagesFolder, 'campo.jpg') 
      : path.join(fieldImagesFolder, `${campo}.jpg`);
    
    if (!fs.existsSync(fieldImagePath)) {
      return res.status(404).send("Erro: Imagem do campo não encontrada.");
    }

    const fieldImage = await sharp(fieldImagePath).resize(3463, 3464).toBuffer();

    const playerImages = [jogador1, jogador2]
      .map(jogador => path.join(playersFolder, `${jogador}.png`))
      .filter(filePath => fs.existsSync(filePath));

    if (playerImages.length < 2) {
      return res.status(404).send("Erro: Uma ou mais imagens de jogadores não foram encontradas.");
    }

    const playerBuffers = await Promise.all(
      playerImages.map(async (imagePath) => {
        return await sharp(imagePath).resize(850, 950).toBuffer();
      })
    );

    let image = sharp(fieldImage);
    const layers = playerBuffers.map((buffer, index) => ({
      input: buffer,
      top: 200,
      left: 100 + (index * 100),
    }));

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