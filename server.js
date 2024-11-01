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
  
  const public_id = req.file.filename; // Pega o nome do arquivo como public_id
  const imageUrl = `https://res.cloudinary.com/drxkjmcqx/image/upload/${public_id}.png`; // Cria a URL limpa
  
  res.json({ url: imageUrl, public_id }); // Retorna a URL limpa
});

// Rota para servir o HTML de upload
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Nova rota para servir as imagens diretamente
app.get('/cards/:id', (req, res) => {
  const { id } = req.params;
  const imageUrl = `https://res.cloudinary.com/drxkjmcqx/image/upload/${id}.png`; // Ajusta a URL para o formato correto
  res.redirect(imageUrl); // Redireciona para a URL da imagem
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});