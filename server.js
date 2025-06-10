const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).send('Nessun file caricato');
  res.json({ filename: req.file.filename });
});

app.get('/all-photos', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return res.status(500).send('Errore caricamento foto');
    res.json({ photos: files });
  });
});

app.post('/vote', (req, res) => {
  const { winner } = req.body;
  if (!winner) return res.status(400).send('Manca il voto');
  const votesFile = './votes.json';
  let votes = [];

  if (fs.existsSync(votesFile)) {
    try {
      votes = JSON.parse(fs.readFileSync(votesFile));
    } catch { votes = []; }
  }

  votes.push({ winner, timestamp: Date.now() });

  try {
    fs.writeFileSync(votesFile, JSON.stringify(votes, null, 2));
    res.json({ message: 'Voto salvato' });
  } catch (err) {
    res.status(500).send('Errore salvataggio voto');
  }
});

app.use('/uploads', express.static(uploadsDir));

const PORT = 3000;
app.listen(PORT, () => console.log(`Server attivo su http://localhost:${PORT}`));
