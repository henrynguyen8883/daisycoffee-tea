const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

db.serialize(() => {
    // 1. Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'employee', -- 'employee' | 'manager'
        username TEXT UNIQUE,
        password_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. Materials Table
    db.run(`CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        base_unit TEXT NOT NULL, -- 'g', 'ml', 'bich', 'chai'
        base_amount REAL NOT NULL, -- e.g., 500 (g), 1000 (ml)
        base_price REAL NOT NULL, -- Price for that base_amount
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 3. Usage Log Table
    db.run(`CREATE TABLE IF NOT EXISTS materials_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        material_id INTEGER,
        date TEXT NOT NULL, -- YYYY-MM-DD
        quantity REAL, -- number of units (e.g., 2 bags) OR raw weight
        weight REAL, -- if measuring by weight/volume directly
        total_price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(material_id) REFERENCES materials(id)
    )`);

    // 4. Seeding Initial Materials (if empty)
    db.get("SELECT count(*) as count FROM materials", (err, row) => {
        if (row.count === 0) {
            const seedData = [
                ['Trà Lài', 'g', 1000, 150000],
                ['Sữa Đặc', 'hop', 1, 24000],
                ['Trân Châu Trắng', 'bich', 1, 85000],
                ['Ly Nhựa (Logo)', 'cai', 50, 45000],
                ['Syrup Đào', 'chai', 1, 120000]
            ];
            const stmt = db.prepare("INSERT INTO materials (name, base_unit, base_amount, base_price) VALUES (?, ?, ?, ?)");
            seedData.forEach(item => stmt.run(item));
            stmt.finalize();
            console.log("Seeded initial materials");
        }
    });
});

module.exports = db;
