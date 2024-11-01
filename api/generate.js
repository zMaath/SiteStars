const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const fieldImagePath = path.join(__dirname, '..', 'images', 'campo.jpg');
/*
if (!fs.existsSync(fieldImagePath)) {
  console.error("Erro: A imagem do campo não foi encontrada no caminho especificado.");
return res.status(404).send("Erro: A imagem do campo não foi encontrada.");
}
*/

app.post('/api/generate', async (req, res) => {
  try {
    // Carrega e redimensiona a imagem do campo
    const fieldImage = await sharp(fieldImagePath).resize(3463, 3464).toBuffer();

    // URLs das imagens dos jogadores
    const playerImages = [
      "https://site-stars.vercel.app/cards/yqhhxzhqlogpontjpoyb.png",
      "https://site-stars.vercel.app/cards/dtiuo6hxnvxsmq1mu9o9.png"
    ];

    // Carrega e sobrepõe as imagens dos jogadores
    const playerBuffers = await Promise.all(
      playerImages.map(async (url) => {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        // Redimensiona a imagem do jogador para 300x400 pixels
        return await sharp(response.data).resize(850, 950).toBuffer();
      })
    );

    // Cria a imagem final
    let image = sharp(fieldImage);

    // Sobrepõe cada imagem de jogador na posição desejada
      const layers = []
      playerBuffers.forEach((playerBuffer, index) => {
      const x = 100 + (index * 100);
      const y = 200;
      layers.push({ input: playerBuffer, top: y, left: x })
      });
      image = image.composite(layers)

    // Redimensiona a imagem final se necessário
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