// server.js
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ MySQL Connection (Clever Cloud)
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'bz9zfridhbswewaxgshi-mysql.services.clever-cloud.com',
  user: process.env.DB_USER || 'ukrszeatzy7u3bla',
  password: process.env.DB_PASS || '9Nbmxaw7XGBsY7eQdYRe',
  database: process.env.DB_NAME || 'bz9zfridhbswewaxgshi'
});

db.connect(err => {
  if (err) throw err;
  console.log('✅ Connected to Clever Cloud MySQL');
});

// Create users table if not exists
db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
  )
`, (err) => {
  if (err) throw err;
  console.log("✅ Users table is ready.");
});

// 🔐 Signup route
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    db.query(query, [name, email, hashedPassword], (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: "Email already registered" });
        }
        return res.status(500).json({ message: "Server error" });
      }
      res.status(201).json({ message: "User registered successfully" });
    });
  } catch (error) {
    res.status(500).json({ message: "Hashing failed" });
  }
});

// 🔓 Login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = results[0];

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.status(200).json({ message: "Login successful" });
    } catch (compareError) {
      res.status(500).json({ message: "Password comparison failed" });
    }
  });
});

// Root
app.get('/', (req, res) => {
  res.send('✅ PeriChat Backend is running.');
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
