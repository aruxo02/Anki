const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const csvParser = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const upload = multer({ dest: 'uploads/' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1/anki', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const UserSchema = new mongoose.Schema({
    username: String,
    password: String
});

const CardSchema = new mongoose.Schema({
    front: String,
    back: String,
    image: String
});

const DeckSchema = new mongoose.Schema({
    name: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    public: { type: Boolean, default: false },
    cards: [CardSchema]
});

const User = mongoose.model('User', UserSchema);
const Deck = mongoose.model('Deck', DeckSchema);

const jwtSecret = process.env.JWT_SECRET || 'secret';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();
    res.json({ id: user._id });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.sendStatus(401);
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.sendStatus(401);
    const token = jwt.sign({ id: user._id, username: user.username }, jwtSecret);
    res.json({ token });
});

app.get('/api/decks', authenticateToken, async (req, res) => {
    const decks = await Deck.find({ owner: req.user.id });
    res.json(decks);
});

app.post('/api/decks', authenticateToken, async (req, res) => {
    const { name } = req.body;
    const deck = new Deck({ name, owner: req.user.id });
    await deck.save();
    res.json(deck);
});

app.post('/api/decks/:id/cards', authenticateToken, async (req, res) => {
    const deck = await Deck.findById(req.params.id);
    if (!deck || String(deck.owner) !== req.user.id) return res.sendStatus(404);
    const { front, back, image } = req.body;
    deck.cards.push({ front, back, image });
    await deck.save();
    res.json(deck);
});

app.get('/api/decks/:id/export', authenticateToken, async (req, res) => {
    const deck = await Deck.findById(req.params.id);
    if (!deck || String(deck.owner) !== req.user.id) return res.sendStatus(404);
    const csvWriter = createCsvWriter({
        path: `exports/deck-${deck._id}.csv`,
        header: [
            { id: 'front', title: 'front' },
            { id: 'back', title: 'back' }
        ]
    });
    await csvWriter.writeRecords(deck.cards.map(c => ({ front: c.front, back: c.back })));
    res.download(`exports/deck-${deck._id}.csv`);
});

app.post('/api/decks/:id/import', authenticateToken, upload.single('file'), async (req, res) => {
    const deck = await Deck.findById(req.params.id);
    if (!deck || String(deck.owner) !== req.user.id) return res.sendStatus(404);
    const filePath = req.file.path;
    const cards = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => cards.push({ front: row.front, back: row.back }))
      .on('end', async () => {
          deck.cards.push(...cards);
          await deck.save();
          fs.unlinkSync(filePath);
          res.json(deck);
      });
});

app.get('/api/community', async (req, res) => {
    const { search } = req.query;
    const query = { public: true };
    if (search) query.name = new RegExp(search, 'i');
    const decks = await Deck.find(query).populate('owner', 'username');
    res.json(decks);
});

app.put('/api/decks/:id/share', authenticateToken, async (req, res) => {
    const deck = await Deck.findById(req.params.id);
    if (!deck || String(deck.owner) !== req.user.id) return res.sendStatus(404);
    deck.public = true;
    await deck.save();
    res.json(deck);
});

app.listen(3001, () => console.log('Server running on http://localhost:3001')); 
