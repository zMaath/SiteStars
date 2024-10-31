const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Configuração do CORS
app.use(cors());

// Array para armazenar URLs das imagens (em produção, use um banco de dados)
let imageUrls = [];

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
    folder: 'uploads', // Pasta no Cloudinary onde as imagens serão salvas
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

// Rota para upload de imagem
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhuma imagem foi enviada.');
  }
  const imageUrl = req.file.path;
  imageUrls.push(imageUrl); // Armazena a URL no array
  res.json({ url: imageUrl }); // URL pública da imagem no Cloudinary
});

// Rota para listar todas as imagens enviadas
app.get('/images', (req, res) => {
  res.json(imageUrls); // Retorna o array de URLs
});

// Servir o HTML de upload
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});