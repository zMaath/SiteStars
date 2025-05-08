const cloudinary = require('cloudinary').v2;
const axios = require('axios');

cloudinary.config({
  cloud_name: 'drxkjmcqx',
  api_key: '835598171251887',
  api_secret: 'Y9nEvGTwOb4WLfTzGx0MW2l9BIM',
});

module.exports = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).send("ID da imagem não foi fornecido.");
    }

    const imageUrl = `https://res.cloudinary.com/drxkjmcqx/image/upload/meus_links/${id}.png`;
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    res.setHeader('Content-Type', 'image/png');
    res.send(response.data);

  } catch (error) {
    console.error("Erro ao buscar a imagem:", error.message);
    res.status(500).send(`Erro ao buscar imagem: ${error.message}`);
  }
};
