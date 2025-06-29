const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

// Schema utente
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Connessione a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connesso'))
.catch(err => console.error('Errore connessione MongoDB:', err));

// Endpoint registrazione
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if(!email || !password) {
    return res.status(400).json({ message: 'Email e password sono richiesti' });
  }

  try {
    // Controlla se email già esiste
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email già registrata' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crea utente nuovo
    const user = new User({ email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'Utente registrato con successo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});
// Endpoint login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if(!email || !password) {
    return res.status(400).json({ message: 'Email e password sono richiesti' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }

    // Genera token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login effettuato con successo', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Errore server' });
  }
});

app.listen(port, () => {
  console.log(`Server attivo su http://localhost:${port}`);
});
