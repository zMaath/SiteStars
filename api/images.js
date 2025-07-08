const path = require('path');
const fs = require('fs');
const express = require('express')

const app = express();

//module.exports = async (req, res) => {
    app.get('/api/images', async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).send("ID da imagem não foi fornecido.");
    }

    const imagePath = path.resolve(__dirname, '..', 'images', `${id}.png`);

    if (!fs.existsSync(imagePath)) {
      return res.status(404).send("Imagem não encontrada.");
    }

    const imageBuffer = fs.readFileSync(imagePath);
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);

  } catch (error) {
    console.error("Erro ao buscar a imagem:", error.message);
    res.status(500).send(`Erro ao buscar imagem: ${error.message}`);
  }
    })

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
