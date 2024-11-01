const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const cors = require('cors');
const axios = require('axios'); // Importa o Axios para buscar as imagens do Cloudinary

const app = express();
const port = process.env.PORT || 3000;

// Configuração do CORS
app.use(cors());

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: 'drxkjmcqx',
  api_key: '835598171251887',
  api_secret: 'Y9nEvGTwOb4WLfTzGx0MW2l9BIM',
});

// Configuração do armazenamento usando o Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'meus_links',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

// Rota para upload de imagem
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhuma imagem foi enviada.');
  }
  
  const public_id = req.file.filename;
  const imageUrl = `https://site-stars.vercel.app/cards/${public_id}.png`;
  
  res.json({ url: imageUrl, public_id });
});

// Rota para servir o HTML de upload
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para servir imagens diretamente com ".png" no final
app.get('/cards/:id.png', async (req, res) => {
  const { id } = req.params;
  const imageUrl = `https://res.cloudinary.com/drxkjmcqx/image/upload/meus_links/${id}.png`;

  try {
    // Faz a requisição à imagem do Cloudinary e retorna diretamente ao cliente
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    res.setHeader('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    res.status(404).send('Imagem não encontrada.');
  }
});
// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});