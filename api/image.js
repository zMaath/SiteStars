const cloudinary = require('cloudinary').v2;
const axios = require('axios');

cloudinary.config({
  cloud_name: 'drxkjmcqx',
  api_key: '835598171251887',
  api_secret: 'Y9nEvGTwOb4WLfTzGx0MW2l9BIM',
});

module.exports = async (req, res) => {
  const { id } = req.query; // Obtém o ID da imagem a partir da query
  const imageUrl = `https://res.cloudinary.com/drxkjmcqx/image/upload/meus_links/${id}.png`;

  try {
    // Busca a imagem no Cloudinary
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    res.setHeader('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    // Retorna o erro completo como resposta
    res.status(404).send(`Imagem não encontrada. Detalhes do erro: ${error.message}. URL buscada: ${imageUrl}`);
  }
};