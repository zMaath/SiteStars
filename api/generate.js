const sharp = require('sharp');
const path = require('path');
const axios = require('axios');
const fs = require('fs').promises;

module.exports = async (req, res) => {
  try {
    const { players } = req.body; // Expects an array of players with { url, x, y, width, height } 

    if (!players || players.length === 0) {
      return res.status(400).send("Os dados dos jogadores são necessários.");
    }

    // Carregar imagem do campo como base
    const fieldImage = await sharp(path.resolve(__dirname, 'images/campo.jpg'));

    // Array para armazenar promessas de buffer de cada jogador
    const playerBuffers = await Promise.all(players.map(async (player) => {
      const response = await axios.get(player.url, { responseType: 'arraybuffer' });
      return {
        input: await sharp(response.data)
          .resize(player.width, player.height)  // Redimensiona o jogador conforme necessário
          .toBuffer(),
        left: player.x,
        top: player.y
      };
    }));

    // Compor imagem do campo com todas as imagens de jogadores
    const finalImage = await fieldImage.composite(playerBuffers).toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.send(finalImage);
  } catch (error) {
    console.error("Erro ao gerar a imagem:", error.message);
    res.status(500).send(`Erro ao gerar a imagem: ${error.message}`);
  }
};