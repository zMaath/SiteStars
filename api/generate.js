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

    // Defina o caminho da imagem do campo e verifique se existe
    const fieldImagePath = (campo === 'normal') 
      ? path.join(fieldImagesFolder, 'campo.png') 
      : path.join(fieldImagesFolder, `${campo}.png`);

    if (!fs.existsSync(fieldImagePath)) {
      console.error("Erro: Imagem do campo não encontrada no caminho:", fieldImagePath);
      return res.status(404).send("Erro: Imagem do campo não encontrada.");
    }

    // Prepara as IDs dos jogadores e exclui valores inválidos
    const playerIds = [jogador1, jogador2, jogador3, jogador4, jogador5, jogador6, jogador7, jogador8, jogador9, jogador10]
      .filter(id => id && id !== 'nenhum');
    
    // Carrega as imagens do campo e dos jogadores em paralelo
    const [fieldBuffer, gkBuffer, playerBuffers] = await Promise.all([
      sharp(fieldImagePath)
        .resize(1062, 1069) // Garante o tamanho correto da imagem do campo
        .toBuffer(),

      gk && gk !== 'nenhum' 
        ? sharp(path.join(playersFolder, `${gk}.png`)).resize(225, 240).toBuffer()
        : Promise.resolve(null),

      Promise.all(
        playerIds.map(async id => {
          const imagePath = path.join(playersFolder, `${id}.png`);
          return fs.existsSync(imagePath) ? sharp(imagePath).resize(225, 240).toBuffer() : null;
        })
      )
    ]);

    if (!gkBuffer && playerBuffers.every(buffer => buffer === null)) {
      return res.status(404).send("Erro: Nenhuma imagem válida de goleiro ou jogador foi fornecida.");
    }

    // Configura as posições
    const layers = [];

    // Adiciona o goleiro, se presente
    if (gkBuffer) {
      layers.push({ input: gkBuffer, top: 791, left: 423 });
    }

    // Configurações de posição para os jogadores
    const playerPositions = [
      { top: 696, left: 223 }, // ZAG
      { top: 699, left: 615 }, // ZAG
      { top: 572, left: 19 },  // LE
      { top: 572, left: 822 }, // LD
      { top: 479, left: 420 }, // VOL
      { top: 321, left: 250 }, // MEI
      { top: 384, left: 615 }, // MC
      { top: 162, left: 83 },  // PE
      { top: 168, left: 749 }, // PD
      { top: 106, left: 418 }, // CA
    ];

    // Adiciona as imagens dos jogadores nas camadas
    playerBuffers.forEach((buffer, index) => {
      if (buffer) {
        const position = playerPositions[index];
        layers.push({
          input: buffer,
          top: position.top,
          left: position.left,
        });
      }
    });

    // Composita as camadas no campo
    const image = await sharp(fieldBuffer)
      .composite(layers)
      .webp({ quality: 80 }) // Define a qualidade para reduzir o tamanho do buffer
      .toBuffer();

    // Envia a imagem final como resposta
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