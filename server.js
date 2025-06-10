const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json()); // Per leggere JSON dal body

// Creiamo la cartella uploads se non esiste
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configuriamo multer per salvare i file in uploads con nome univoco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Endpoint per upload foto (campo 'photo')
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nessun file caricato');
  }
  res.json({ filename: req.file.filename });
});

// Endpoint per ottenere 2 immagini random dalla cartella uploads
app.get('/random-photos', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err || files.length < 2) {
      return res.status(500).send('Non ci sono abbastanza foto');
    }

    // Mescola l'array e prendi le prime 2
    const shuffled = files.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 2);

    res.json({ photos: selected });
  });
});

// Endpoint per salvare il voto
app.post('/vote', (req, res) => {
  const { winner } = req.body;
  if (!winner) {
    return res.status(400).send('Manca il voto');
  }

  const votesFile = './votes.json';
  let votes = [];

  if (fs.existsSync(votesFile)) {
    try {
      votes = JSON.parse(fs.readFileSync(votesFile));
    } catch {
      votes = [];
    }
  }

  votes.push({ winner, timestamp: Date.now() });

  try {
    fs.writeFileSync(votesFile, JSON.stringify(votes, null, 2));
    res.json({ message: 'Voto salvato' });
  } catch (err) {
    res.status(500).send('Errore salvataggio voto');
  }
});

// Servire le immagini statiche dalla cartella uploads
app.use('/uploads', express.static(uploadsDir));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server attivo su http://localhost:${PORT}`);
});

// Nuovo endpoint per tutte le foto
app.get('/all-photos', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).send('Errore caricamento foto');
    }
    res.json({ photos: files });
  });
});
