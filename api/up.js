const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

function generateUniqueId(existingFiles) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id;
  do {
    id = Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (existingFiles.includes(`${id}.png`));
  return id;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'cards');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'cards');
    const existingFiles = fs.readdirSync(dir);
    const id = generateUniqueId(existingFiles);
    cb(null, `${id}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

router.post('/', upload.single('imagem'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
  }

  const fileName = path.basename(req.file.filename);
  const finalUrl = `https://ustars.vercel.app/cards/${fileName}`;
  res.json({ url: finalUrl });
});

module.exports = router;