const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();

const fieldImagesFolder = path.join(__dirname, '..', 'images');
const playersFolder = path.join(__dirname, '..', 'players');

// Mapeamento de formações para arquivos de campo e posições
const formations = {
  '4-3-3': {
    fieldImage: '433.png',
    positions: [
      { top: 791, left: 423 }, { top: 696, left: 223 }, { top: 699, left: 615 },
      { top: 572, left: 19 }, { top: 572, left: 822 }, { top: 479, left: 420 },
      { top: 321, left: 250 }, { top: 384, left: 615 }, { top: 162, left: 83 },
      { top: 168, left: 749 }, { top: 106, left: 418 }
    ]
  },
  '4-3-3B': {
    fieldImage: '433b.png',
    positions: [
      { top: 791, left: 423 }, { top: 696, left: 223 }, { top: 699, left: 615 },
      { top: 572, left: 19 }, { top: 572, left: 822 }, { top: 479, left: 420 },
      { top: 321, left: 250 }, { top: 384, left: 615 }, { top: 162, left: 83 },
      { top: 168, left: 749 }, { top: 106, left: 418 }
    ]
  },
  '4-4-2': {
    fieldImage: 'campo2.png',
    positions: [
      { top: 791, left: 423 }, { top: 696, left: 223 }, { top: 699, left: 615 },
      { top: 572, left: 19 }, { top: 572, left: 822 }, { top: 479, left: 420 },
      { top: 384, left: 230 }, { top: 384, left: 600 }, { top: 162, left: 100 },
      { top: 162, left: 750 }, { top: 106, left: 420 }
    ]
  },
  // Adicione mais formações aqui...
};

app.get('/api/generate', async (req, res) => {
  try {
    const {
      formacao = '4-3-3',
      gk,
      jogador1, jogador2, jogador3, jogador4,
      jogador5, jogador6, jogador7,
      jogador8, jogador9, jogador10
    } = req.query;

    // Verificar se a formação existe, caso contrário, usar padrão (4-3-3)
    const formation = formations[formacao] || formations['4-3-3'];

    // Caminho da imagem do campo para a formação
    const fieldImagePath = path.join(fieldImagesFolder, formation.fieldImage);
    if (!fs.existsSync(fieldImagePath)) {
      return res.status(404).send(`Error: Field image for formation "${formacao}" not found.`);
    }

    // Carregar a imagem do campo e redimensionar
    const fieldBuffer = await sharp(fieldImagePath)
      .resize(1062, 1069)  // Ajuste o tamanho para o layout
      .toBuffer();

    // IDs dos jogadores
    const playerIds = [gk, jogador1, jogador2, jogador3, jogador4, jogador5, jogador6, jogador7, jogador8, jogador9, jogador10];

    // Função para processar a imagem de um jogador
    const processPlayerImage = async (id, index) => {
      if (!id || id === 'nenhum') return null;

      const imagePath = path.join(playersFolder, `${id}.png`);
      if (!fs.existsSync(imagePath)) return null;

      const buffer = await sharp(imagePath)
        .resize(225, 240)  // Redimensionar jogador para o tamanho desejado
        .toBuffer();
      return { input: buffer, top: formation.positions[index].top, left: formation.positions[index].left };
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