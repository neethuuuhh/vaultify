import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import db, { initDB } from './db.js';

const app = express();
const PORT = 5000;
const JWT_SECRET = 'super-secret-vaultify-key';

app.use(cors());
app.use(express.json());

// Initialize database
initDB();

// 1. Get Salt for User (Login Step 1)
app.get('/api/auth/salt/:username', (req, res) => {
    const { username } = req.params;
    db.get(`SELECT salt FROM users WHERE username = ?`, [username], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ salt: row.salt });
    });
});

// 2. Register Route
app.post('/api/auth/register', (req, res) => {
    const { username, authKey, salt } = req.body;
    
    const query = `INSERT INTO users (username, auth_key, salt, vault_blob) VALUES (?, ?, ?, ?)`;
    db.run(query, [username, authKey, salt, null], function (err) {
        if (err) {
            console.error('Registration error:', err.message);
            return res.status(400).json({ error: 'Username already exists.' });
        }
        res.status(201).json({ message: 'User registered successfully!' });
    });
});

// 3. Login Route
app.post('/api/auth/login', (req, res) => {
    const { username, authKey } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err || !user || user.auth_key !== authKey) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ token });
    });
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token missing' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// 4. Get Vault Blob
app.get('/api/vault', verifyToken, (req, res) => {
    db.get(`SELECT vault_blob FROM users WHERE id = ?`, [req.user.userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ vaultBlob: row ? JSON.parse(row.vault_blob || 'null') : null });
    });
});

// 5. Update Vault Blob
app.put('/api/vault', verifyToken, (req, res) => {
    const { vaultBlob } = req.body;

    db.run(`UPDATE users SET vault_blob = ? WHERE id = ?`, [JSON.stringify(vaultBlob), req.user.userId], (err) => {
        if (err) {
            console.error('Vault update error:', err.message);
            return res.status(500).json({ error: 'Failed to update vault' });
        }
        res.json({ message: 'Vault updated successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});