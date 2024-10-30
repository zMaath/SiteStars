const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

// Verifique se a pasta uploads existe, se não, crie-a
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configurar o armazenamento usando multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Pasta onde as imagens serão salvas
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Nome único para cada imagem
  },
});
const upload = multer({ storage: storage });

// Servir o arquivo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para upload de imagem
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhuma imagem foi enviada.');
  }
  // Retornar a URL da imagem
  res.json({ url: `/images/${req.file.filename}` });
});

// Rota para acessar imagens
app.use('/images', express.static(uploadDir));

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});