const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 2707; // We'll use port 2707 for the server

// --- Middleware ---
// Enable Cross-Origin Resource Sharing for all routes
app.use(cors());
// Enable the express.json middleware to parse JSON request bodies, with a larger limit for file uploads
app.use(express.json({ limit: '10mb' }));

// In a real production app, use an environment variable for this!
const JWT_SECRET = 'your-super-secret-key-for-lattice-app';

// --- Database Setup ---
const db = new sqlite3.Database('./lattice.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the lattice.db SQLite database.');
});

// Create bookings table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY, seriesId TEXT, name TEXT, type TEXT, startDateTime TEXT, endDateTime TEXT, status TEXT
)`);

// Create inventory table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY, name TEXT, sku TEXT, quantity INTEGER, location TEXT, createdAt TEXT, updatedAt TEXT
)`);

// Create settings table if it doesn't exist (using a simple key-value structure)
db.run(`CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
)`);

// Create users table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, username TEXT UNIQUE, firstName TEXT, lastName TEXT, role TEXT, passwordHash TEXT, createdAt TEXT
)`);

// --- Routes ---
// A simple test route to make sure the server is running
app.get('/api', (req, res) => {
  res.json({ message: "Hello from the Lattice Data Server!" });
});

// GET all bookings
app.get('/api/bookings', (req, res) => {
  db.all("SELECT * FROM bookings ORDER BY startDateTime ASC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(200).json(rows);
  });
});

// POST a new booking (or multiple bookings for recurring events)
app.post('/api/bookings', (req, res) => {
  const newBookings = req.body; // Expecting an array of new bookings
  if (!Array.isArray(newBookings)) {
    return res.status(400).json({ message: 'Request body must be an array of bookings.' });
  }

  const stmt = db.prepare("INSERT INTO bookings (id, seriesId, name, type, startDateTime, endDateTime, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
  newBookings.forEach(booking => {
    stmt.run(booking.id, booking.seriesId, booking.name, booking.type, booking.startDateTime, booking.endDateTime, booking.status);
  });
  stmt.finalize((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json(newBookings);
  });
});

// PUT (update) a booking by ID
app.put('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, startDateTime, endDateTime } = req.body;

  const sql = `UPDATE bookings SET name = ?, type = ?, startDateTime = ?, endDateTime = ? WHERE id = ?`;

  db.run(sql, [name, type, startDateTime, endDateTime, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(this.changes > 0 ? 200 : 404).json({ message: "Booking updated", changes: this.changes });
  });
});

// DELETE a booking by ID
app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM bookings WHERE id = ?`, id, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(this.changes > 0 ? 204 : 404).send(); // 204 No Content, or 404 Not Found
  });
});

// --- Settings Routes ---

// GET settings by key
app.get('/api/settings/:key', (req, res) => {
  const { key } = req.params;
  db.get("SELECT value FROM settings WHERE key = ?", [key], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    // If settings exist, parse and send them. Otherwise, we can let the front-end use defaults.
    if (row) {
      res.status(200).json(JSON.parse(row.value));
    } else {
      res.status(404).json({ message: "Settings not found for this key." });
    }
  });
});

// PUT (upsert) settings by key
app.put('/api/settings/:key', (req, res) => {
  const { key } = req.params;
  const value = JSON.stringify(req.body);
  const sql = `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`;
  db.run(sql, [key, value], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: "Settings updated" });
  });
});

// --- Inventory Routes ---

// GET all inventory
app.get('/api/inventory', (req, res) => {
  db.all("SELECT * FROM inventory ORDER BY name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST a new inventory item
app.post('/api/inventory', (req, res) => {
  const { id, name, sku, quantity, location, createdAt, updatedAt } = req.body;
  const sql = `INSERT INTO inventory (id, name, sku, quantity, location, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [id, name, sku, quantity, location, createdAt, updatedAt], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, ...req.body });
  });
});

// POST for bulk inventory import
app.post('/api/inventory/bulk', (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Request body must be a non-empty array of inventory items.' });
  }

  const sql = `INSERT INTO inventory (id, name, sku, quantity, location, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare(sql);
    items.forEach(item => {
      stmt.run(item.id, item.name, item.sku, item.quantity, item.location, item.createdAt, item.updatedAt);
    });
    stmt.finalize((err) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }
      db.run("COMMIT", () => res.status(201).json({ message: `${items.length} items imported successfully.` }));
    });
  });
});

// PUT (update) an inventory item by ID
app.put('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const { name, sku, quantity, location, updatedAt } = req.body;
  const sql = `UPDATE inventory SET name = ?, sku = ?, quantity = ?, location = ?, updatedAt = ? WHERE id = ?`;
  db.run(sql, [name, sku, quantity, location, updatedAt, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(this.changes > 0 ? 200 : 404).json({ message: "Inventory item updated" });
  });
});

// DELETE all inventory items
app.delete('/api/inventory/all', (req, res) => {
  db.run(`DELETE FROM inventory`, [], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    console.log(`All inventory data cleared. ${this.changes} rows affected.`);
    res.status(204).send(); // 204 No Content
  });
});

// DELETE an inventory item by ID
app.delete('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM inventory WHERE id = ?`, id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(this.changes > 0 ? 204 : 404).send();
  });
});

// --- User Routes ---

// GET all users
app.get('/api/users', (req, res) => {
  // Select all fields except passwordHash for security
  db.all("SELECT id, username, firstName, lastName, role, createdAt FROM users ORDER BY lastName ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST a new user
app.post('/api/users', (req, res) => {
  const { id, username, firstName, lastName, role, password, createdAt } = req.body;

  // Basic validation
  if (!username || !firstName || !lastName || !role || !password) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  // Securely hash the password
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  const storedPassword = `${salt}:${passwordHash}`; // Store salt with hash

  const sql = `INSERT INTO users (id, username, firstName, lastName, role, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [id, username, firstName, lastName, role, storedPassword, createdAt], function(err) {
    if (err) {
      // Handle unique constraint violation for username
      if (err.message.includes('UNIQUE constraint failed: users.username')) {
        return res.status(409).json({ message: `Username '${username}' already exists.` });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id, username, firstName, lastName, role, createdAt });
  });
});

// --- Auth Routes ---

// POST to login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const sql = `SELECT * FROM users WHERE username = ?`;
  db.get(sql, [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    // Verify password
    const [salt, storedHash] = user.passwordHash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    if (hash !== storedHash) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Passwords match, create JWT
    const userPayload = { id: user.id, username: user.username, role: user.role, firstName: user.firstName, lastName: user.lastName };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '8h' });

    res.status(200).json({ token, user: userPayload });
  });
});

// --- Start Server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Lattice data server is running and listening on port ${PORT}`);
});
