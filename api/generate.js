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

    // Define o caminho da imagem do campo
    const fieldImagePath = (campo === 'normal') 
      ? path.join(fieldImagesFolder, 'campo.jpg') 
      : path.join(fieldImagesFolder, `${campo}.jpg`);

    console.log("Caminho da imagem do campo:", fieldImagePath);

    if (!fs.existsSync(fieldImagePath)) {
      console.error("Erro: Imagem do campo não encontrada no caminho:", fieldImagePath);
      return res.status(404).send("Erro: Imagem do campo não encontrada.");
    }

    // Carrega a imagem do campo
    const fieldImage = await sharp(fieldImagePath).resize(3463, 3464).toBuffer();

    // Define o caminho do goleiro, se o ID `gk` for fornecido e não for "nenhum"
    const gkImagePath = gk && gk !== 'nenhum' ? path.join(playersFolder, `${gk}.png`) : null;
    const gkBuffer = gkImagePath && fs.existsSync(gkImagePath)
      ? await sharp(gkImagePath).resize(850, 950).toBuffer()
      : null;

    // Coleta as imagens dos jogadores especificados como `jogador1`, `jogador2`, etc.
    const playerIds = [jogador1, jogador2, jogador3, jogador4, jogador5, jogador6, jogador7, jogador8, jogador9, jogador10]
      .filter(id => id && id !== 'nenhum'); // Remove valores "nenhum" ou não fornecidos

    // Cria os caminhos para os jogadores
    const playerImages = playerIds
      .map(id => path.join(playersFolder, `${id}.png`))
      .filter(filePath => fs.existsSync(filePath));

    if (gkBuffer === null && playerImages.length === 0) {
      return res.status(404).send("Erro: Nenhuma imagem válida de goleiro ou jogador foi fornecida.");
    }

    // Carrega as imagens dos jogadores
    const playerBuffers = await Promise.all(
      playerImages.map(async (imagePath) => {
        return await sharp(imagePath).resize(850, 950).toBuffer();
      })
    );

    let image = sharp(fieldImage);
    
    // Define a posição do goleiro
    const layers = [];
    if (gkBuffer) {
      layers.push({
        input: gkBuffer,
        top: 2000, // Posição do goleiro na parte superior
        left: 1300, // Centralizado horizontalmente no campo
      });
    }

    // Posiciona cada jogador na imagem final
    playerBuffers.forEach((buffer, index) => {
      layers.push({
        input: buffer,
        top: 200, // Ajuste vertical para jogadores de linha
        left: 100 + (index * 100), // Ajuste de espaçamento horizontal
      });
    });

    // Compositar as camadas
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