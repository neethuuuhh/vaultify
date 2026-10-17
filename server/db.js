import sqlite3 from 'sqlite3';

const sqlite = sqlite3.verbose();
const db = new sqlite.Database('./vaultify.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to local SQLite database.');
    }
});

export const initDB = () => {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            auth_key TEXT,
            salt TEXT,
            vault_blob TEXT
        )`);
        console.log('Database initialized successfully.');
    });
};

export default db;