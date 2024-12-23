const cloudinary = require('cloudinary').v2;
const { request } = require('undici');

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

    const imageUrl = `https://res.cloudinary.com/drxkjmcqx/image/upload/w_1080,h_1080,c_fill/meus_links/${id}.png`;

    const { body } = await request(imageUrl);
    const imageBuffer = await body.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);

  } catch (error) {
    console.error("Erro ao buscar a imagem:", error.message);
    res.status(500).send(`Erro ao buscar imagem: ${error.message}`);
  }
};
