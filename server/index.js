const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// --- ROUTES ---

// 1. Get All Materials
app.get('/api/materials', (req, res) => {
    db.all("SELECT * FROM materials", [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// 2. Add New Material
app.post('/api/materials', (req, res) => {
    const { name, base_unit, base_amount, base_price } = req.body;
    const sql = "INSERT INTO materials (name, base_unit, base_amount, base_price) VALUES (?,?,?,?)";
    const params = [name, base_unit, base_amount, base_price];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: { id: this.lastID, ...req.body }
        });
    });
});

// 3. Log Material Usage
app.post('/api/usage', (req, res) => {
    const { user_id, material_id, date, quantity, weight } = req.body;

    // Fetch material to get base_price and base_amount
    db.get("SELECT * FROM materials WHERE id = ?", [material_id], (err, material) => {
        if (err || !material) {
            res.status(400).json({ error: "Material not found" });
            return;
        }

        let total_price = 0;

        // Logic: (Input / BaseAmount) * BasePrice
        if (quantity) {
            total_price = quantity * material.base_price;
        }
        else if (weight) {
            // (Weight / BaseAmount) * BasePrice
            total_price = (weight / material.base_amount) * material.base_price;
        }

        const sql = `INSERT INTO materials_usage 
                     (user_id, material_id, date, quantity, weight, total_price) 
                     VALUES (?,?,?,?,?,?)`;
        const params = [user_id, material_id, date, quantity, weight, total_price];

        db.run(sql, params, function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({
                message: "success",
                id: this.lastID,
                calculated_price: total_price
            });
        });
    });
});

// 4. Get Usage Report (By Date Range or Month)
app.get('/api/reports', (req, res) => {
    const { start_date, end_date } = req.query;

    let sql = `
        SELECT u.*, m.name as material_name, m.base_unit, m.base_amount, m.base_price
        FROM materials_usage u
        JOIN materials m ON u.material_id = m.id
    `;
    const params = [];

    if (start_date && end_date) {
        sql += ` WHERE u.date BETWEEN ? AND ?`;
        params.push(start_date, end_date);
    }

    sql += ` ORDER BY u.date DESC, u.created_at DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
