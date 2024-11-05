const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const app = express();

// Define a pasta de imagens de campo e jogadores
const fieldImagesFolder = path.join(__dirname, 'images');
const playersFolder = path.join(__dirname, 'players');

app.get('/api/generate', async (req, res) => {
  try {
    const { campo = 'normal', jogador1, jogador2 } = req.query;

    // Define o caminho para a imagem do campo com base no tipo
    const fieldImagePath = (campo === 'normal') 
      ? path.join(fieldImagesFolder, 'campo.jpg') 
      : path.join(fieldImagesFolder, `${campo}.jpg`);
    
    // Verifica se a imagem do campo existe
    if (!fs.existsSync(fieldImagePath)) {
      return res.status(404).send("Erro: Imagem do campo não encontrada.");
    }

    // Carrega e redimensiona a imagem do campo
    const fieldImage = await sharp(fieldImagePath).resize(3463, 3464).toBuffer();

    // Define os caminhos das imagens dos jogadores na pasta "players"
    const playerImages = [jogador1, jogador2]
      .map(jogador => path.join(playersFolder, `${jogador}.png`))
      .filter(fs.existsSync); // Filtra para apenas arquivos que existam

    if (playerImages.length === 0) {
      return res.status(400).send("Erro: Imagens dos jogadores não encontradas.");
    }

    // Carrega e redimensiona as imagens dos jogadores
    const playerBuffers = await Promise.all(
      playerImages.map(async (imagePath) => {
        return await sharp(imagePath).resize(850, 950).toBuffer();
      })
    );

    // Composição da imagem final
    let image = sharp(fieldImage);
    const layers = playerBuffers.map((buffer, index) => ({
      input: buffer,
      top: 200,
      left: 100 + (index * 100), // Ajuste de espaçamento
    }));

    image = image.composite(layers);

    // Exporta a imagem final em formato webp
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